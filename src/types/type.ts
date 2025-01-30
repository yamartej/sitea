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
  quantity: number;
}

export type Inventory = {
  id: number;
  quantity: number;
  product_id : number;
  product : Product[];
  updated_at : Date;
}

export type Customer = {
  id: number;
  name: string;
  address: string;
  phone: string;
}

export type Warehouse = {
  id: number;
  name: string;
  description: string;
  address: string;
}

export type ErrorResponse = {
  status: number;
  message: string;
  response: {
    data: {
      message: string;
    };
    product_id: number;
    quantity: number;
  };
}

export type CartItem = {
  productId: number;
  name: string;
  price: number;
  quantity: number;
}

export type Pop = {
  ubication: string;
  identifier: string;
  id: number;
  name: string;
  address: string;
}

export type ProductCardProps = {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void;
}
