"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Laptop, Moon, Sun } from "lucide-react";
import { motion } from "motion/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const ThemeSwitcher = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const ICON_SIZE = 16;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
        >
          {theme === "light" ? (
            <motion.div
              initial={{ rotate: -30, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Sun
                size={ICON_SIZE}
                className="text-amber-500"
              />
            </motion.div>
          ) : theme === "dark" ? (
            <motion.div
              initial={{ rotate: 30, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Moon
                size={ICON_SIZE}
                className="text-blue-400"
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Laptop
                size={ICON_SIZE}
                className="text-gray-500 dark:text-gray-400"
              />
            </motion.div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40 p-2 mt-1 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl shadow-lg" align="end">
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(e: string) => setTheme(e)}
        >
          <DropdownMenuRadioItem 
            className="flex gap-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800 my-1" 
            value="light"
          >
            <Sun size={ICON_SIZE} className="text-amber-500" />{" "}
            <span>Light</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem 
            className="flex gap-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800 my-1" 
            value="dark"
          >
            <Moon size={ICON_SIZE} className="text-blue-400" />{" "}
            <span>Dark</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem 
            className="flex gap-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800 my-1" 
            value="system"
          >
            <Laptop size={ICON_SIZE} className="text-gray-500 dark:text-gray-400" />{" "}
            <span>System</span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export { ThemeSwitcher };