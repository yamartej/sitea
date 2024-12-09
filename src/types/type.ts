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

export type User = {
  id: number;
  name: string;
  email: string;
  roles: Role[];
  company_id: string;
}

export type Role = {
  id: string;
  name: string;
  description: string;
  pivot: {
    user_id: number;
    roles_id: number;
  };
}

export type Permission = {
  id: number;
  role_id: number;
  menu_id : number;
  can_access: boolean;
}

export type MenuItem = {
  id: number;
  name: string;
  url: string;
  parent_id: number | null;
  order: number;
  children?: MenuItem[];
  isTopLevel: boolean;
}

export type MenuContextType = {
  menuItems: MenuItem[];
  loading: boolean;
}

export type Company = {
  id: number;
  name: string;
}

export type Category = {
  id: number;
  name: string;
}

export type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  category_id: number;
  category: Category[];
}