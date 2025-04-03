"use client";
import ConnectButton from "@/_components/connect-button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/_components/ui/card";
import { ChevronRight, Database, Sparkles, Terminal } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const gridSize = 40; // Grid size in pixels
  const mainRef = useRef(null);
  const [cardPosition, setCardPosition] = useState({ top: 0, left: 0 });
  // Add state for window dimensions to avoid direct window access
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    // Set window dimensions only after component is mounted
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    const alignToGrid = () => {
      const mainElement = mainRef.current;
      if (!mainElement) return;

      // Calculate the center position using state
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      // Calculate the nearest grid position
      const alignedX = Math.round(centerX / gridSize) * gridSize;
      const alignedY = Math.round(centerY / gridSize) * gridSize;

      // Calculate the offset to center the card on the grid
      const cardWidth = 384; // max-w-md is roughly 384px
      const cardHeight = 380; // approximate height of the card

      const left = alignedX - cardWidth / 2;
      const top = alignedY - cardHeight / 2;

      setCardPosition({ top, left });

      // Update window size state
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Run on mount and window resize
    alignToGrid();
    window.addEventListener("resize", alignToGrid);

    return () => {
      window.removeEventListener("resize", alignToGrid);
    };
  }, []);

  // Calculate decoration positions safely
  const topDecoration =
    windowSize.height > 0 ? Math.round((windowSize.height * 0.15) / gridSize) * gridSize : 0;

  const rightDecoration =
    windowSize.width > 0 ? Math.round((windowSize.width * 0.15) / gridSize) * gridSize : 0;

  const bottomDecoration =
    windowSize.height > 0 ? Math.round((windowSize.height * 0.15) / gridSize) * gridSize : 0;

  const leftDecoration =
    windowSize.width > 0 ? Math.round((windowSize.width * 0.15) / gridSize) * gridSize : 0;

  return (
    <main
      ref={mainRef}
      className="flex min-h-screen flex-col items-center justify-center p-4 relative overflow-hidden"
    >
      {/* Background decoration elements */}
      <div className="absolute inset-0 w-full h-full -z-10">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-accent/5 rounded-full blur-3xl" />

        {/* Grid pattern using inline style */}
        <div className="absolute inset-0 grid-pattern opacity-20" />

        {/* Code symbols decoration - aligned to grid */}
        <div
          className="absolute text-muted-foreground/10 text-6xl font-mono rotate-12"
          style={{
            top: topDecoration,
            right: rightDecoration,
          }}
        >
          {"{ }"}
        </div>
        <div
          className="absolute text-muted-foreground/10 text-5xl font-mono -rotate-6"
          style={{
            bottom: bottomDecoration,
            left: leftDecoration,
          }}
        >
          {"SELECT"}
        </div>
      </div>

      {/* Main card positioned to align with grid */}
      <div
        className="absolute"
        style={{
          top: cardPosition.top,
          left: cardPosition.left,
          width: "384px", // max-w-md equivalent
          transition: "top 0.5s, left 0.5s", // Smooth transition when resizing
        }}
      >
        <Card className="w-full border-dashed relative backdrop-blur-sm bg-card/90">
          <CardHeader>
            <div className="flex items-center justify-center space-x-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <CardTitle className="text-center text-4xl font-semibold tracking-tight">
                SQLito
              </CardTitle>
            </div>
            <p className="text-lg text-primary font-medium mt-2">
              Business Intelligence for Tech-Challenged Bosses
            </p>
            <p className="text-sm text-muted-foreground mt-4 max-w-xs mx-auto">
              Connect your Supabase database and start asking questions in plain English — no SQL
              knowledge required
            </p>
          </CardHeader>

          <CardContent className="text-center pb-4">
            {/* Feature highlights */}
            <div className="mt-6 grid grid-cols-1 gap-3 text-left">
              <div className="flex items-start space-x-2">
                <div className="mt-0.5 bg-primary/10 p-1 rounded-md">
                  <Terminal size={16} className="text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Natural language queries to SQL conversion
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="mt-0.5 bg-primary/10 p-1 rounded-md">
                  <Database size={16} className="text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Multiple database environment support
                </p>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-0">
            <ConnectButton />

            <Link
              href="#learn-more"
              className="text-xs text-muted-foreground/70 flex items-center hover:text-primary transition-colors"
            >
              Learn more about SQLito
              <ChevronRight size={14} className="ml-1" />
            </Link>
          </CardFooter>
        </Card>
      </div>

      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-sidebar-primary/5 to-transparent" />
      </div>
    </main>
  );
}
