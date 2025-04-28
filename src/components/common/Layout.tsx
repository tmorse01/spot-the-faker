import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export default function Layout({ children, title }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-indigo-800 text-white p-4">
      <div className="max-w-md mx-auto">
        {title && (
          <h1 className="text-3xl font-bold text-center py-6">{title}</h1>
        )}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-xl">
          {children}
        </div>
      </div>
    </div>
  );
}
