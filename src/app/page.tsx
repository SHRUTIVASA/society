'use client';

import { useEffect, useState } from "react";
import { redirect } from "next/navigation";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      redirect("/home");
    }, 500); 

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
    <div className="min-h-screen flex bg-white items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    </div>
    );
  }

  return null;
}