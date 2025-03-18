// components/header/types.ts

export type User = {
    name: string;
    icon: React.ReactNode | null; // icon có thể là ReactNode (ảnh hoặc component)
  };
  
  export type HeaderProps = {
    user: User;
    pathName: string;
  };
  