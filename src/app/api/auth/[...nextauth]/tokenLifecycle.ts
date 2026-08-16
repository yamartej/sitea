import "server-only";

import axios from "axios";

const apiUrl =
  process.env.NEXT_PUBLIC_URL_API;

interface LaravelTokenPair {
  token: string;
  expiration: string;
  refresh_token: string;
  refresh_expiration: string;
}

/*
 * Collapse simultaneous refresh attempts inside the same Next.js process.
 * The Laravel refresh token is single-use, so concurrent callbacks should
 * share one rotation request whenever possible.
 */
const refreshInFlight =
  new Map<
    string,
    Promise<LaravelTokenPair>
  >();

const requireApiUrl = (): string => {
  if (!apiUrl) {
    throw new Error(
      "NEXT_PUBLIC_URL_API is not configured"
    );
  }

  return apiUrl;
};

export const refreshAccessToken = async (
  refreshToken: string
): Promise<LaravelTokenPair> => {
  const existing =
    refreshInFlight.get(refreshToken);

  if (existing) {
    return existing;
  }

  const request =
    axios
      .post<LaravelTokenPair>(
        `${requireApiUrl()}/refresh-token`,
        {
          refresh_token: refreshToken,
        },
        {
          headers: {
            "Content-Type":
              "application/json",
          },
        }
      )
      .then((response) => response.data)
      .finally(() => {
        refreshInFlight.delete(
          refreshToken
        );
      });

  refreshInFlight.set(
    refreshToken,
    request
  );

  return request;
};

export const revokeBackendSession = async (
  accessToken: string,
  refreshToken: string
): Promise<void> => {
  const baseUrl = requireApiUrl();

  const logout = async (
    bearer: string,
    refresh: string
  ) => {
    await axios.post(
      `${baseUrl}/logout`,
      {
        refresh_token: refresh,
      },
      {
        headers: {
          "Content-Type":
            "application/json",
          Authorization:
            `Bearer ${bearer}`,
        },
      }
    );
  };

  /*
   * Normal case: access token is still valid.
   */
  if (accessToken) {
    try {
      await logout(
        accessToken,
        refreshToken
      );

      return;
    } catch (error) {
      if (
        !axios.isAxiosError(error) ||
        error.response?.status !== 401
      ) {
        throw error;
      }
    }
  }

  /*
   * If the access token already expired, rotate once to obtain a valid
   * access token and immediately revoke the newly issued pair.
   * Rotation also revokes the previous access token.
   */
  try {
    const pair =
      await refreshAccessToken(
        refreshToken
      );

    await logout(
      pair.token,
      pair.refresh_token
    );
  } catch (error) {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401
    ) {
      /*
       * Refresh token is already expired/revoked. There is no live
       * backend session left to revoke.
       */
      return;
    }

    throw error;
  }
};
