export type MenuItem = {
    id: number;
    name: string;
    url: string;
    parent_id: number | null;
    order: number;
    children?: MenuItem[];
    isTopLevel: boolean;
  }


export type Item = {
    id: string;

  }

export type MenuMap ={ 
    [key: number]: MenuItem; 
  }

export type DropdownState = {
    [key: string]: boolean; 
  }  

export type Token = {
  token: string | null;
}  

export type Role = {
  id: number;
  name: string;
  description: string;
  pivot: {
    user_id: number;
    roles_id: number;
  };
}

export type User = {
  id: number;
  name: string;
  email: string;
  roles: Role[];
}