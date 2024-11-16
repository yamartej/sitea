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