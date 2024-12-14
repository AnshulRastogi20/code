'use client';

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function Home() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex flex-col items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center space-y-12 p-8 rounded-2xl backdrop-blur-sm bg-black/30"
      >
        <motion.h1 
          className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          Track your attendance
        </motion.h1>
        <div className="space-x-6">
            <Button 
              variant="outline" 
              className="bg-blue-500 text-white border-2 border-blue-500 hover:bg-blue-600 hover:scale-105 transform transition-all duration-200 px-8 py-6 text-lg"
              onClick={() => router.push('/auth')}
            >
              Track Now
            </Button>
         
        </div>
      </motion.div>
    </main>
  );
}