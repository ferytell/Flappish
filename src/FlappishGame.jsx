import React, { useState, useEffect, useRef } from "react";
import backgroundImg from "./assets/background.png";
import floorImg from "./assets/floor.png";
import birdImg from "./assets/bird3.png";
import pipeImg from "./assets/pipes.png";

const FlappishGame = () => {
  // Responsive game dimensions
  const [dimensions, setDimensions] = useState({
    width: Math.min(1100, window.innerWidth - 40),
    height: Math.min(706, window.innerHeight - 40),
  });

  // Game constants
  const JUMP_FORCE = -10;
  const GRAVITY = 0.4;
  const PIPE_SPEED = 3;
  const PIPE_SPAWN_TIME = 1800;
  const PIPE_HEIGHTS = [400, 450, 500];
  const PIPE_GAP = 250;
  const FLOOR_HEIGHT = 100;

  // Game state
  const [gameActive, setGameActive] = useState(false);
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [showGameOver, setShowGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);

  // Game objects (using refs for performance)
  const birdRef = useRef({
    x: 100,
    y: dimensions.height / 2,
    width: 50,
    height: 70,
    velocity: 0,
  });

  const pipesRef = useRef([]);
  const floorXRef = useRef(0);
  const lastPipeTimeRef = useRef(0);
  const passedPipesRef = useRef(new Set());
  const animationFrameIdRef = useRef(null);
  const imagesRef = useRef({
    background: null,
    floor: null,
    bird: null,
    pipe: null,
  });

  // Canvas ref
  const canvasRef = useRef(null);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: Math.min(1100, window.innerWidth - 40),
        height: Math.min(706, window.innerHeight - 40),
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Reset game dimensions when they change
  useEffect(() => {
    if (!gameActive) {
      birdRef.current = {
        x: 100,
        y: dimensions.height / 2,
        width: 50,
        height: 70,
        velocity: 0,
      };
    }
  }, [dimensions, gameActive]);

  // Load images
  useEffect(() => {
    const loadImages = async () => {
      const bg = new Image();
      bg.src = backgroundImg;

      const floor = new Image();
      floor.src = floorImg;

      const bird = new Image();
      bird.src = birdImg;

      const pipe = new Image();
      pipe.src = pipeImg;

      await Promise.all([
        new Promise((resolve) => {
          bg.onload = resolve;
        }),
        new Promise((resolve) => {
          floor.onload = resolve;
        }),
        new Promise((resolve) => {
          bird.onload = resolve;
        }),
        new Promise((resolve) => {
          pipe.onload = resolve;
        }),
      ]);

      imagesRef.current = { background: bg, floor, bird, pipe };
    };

    loadImages();

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, []);

  // Handle keyboard and touch input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleJump();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showStartScreen, gameActive, showGameOver]);

  // Add touch handler to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouch = (e) => {
      e.preventDefault();
      handleJump();
    };

    canvas.addEventListener("touchstart", handleTouch);
    return () => canvas.removeEventListener("touchstart", handleTouch);
  }, [gameActive]);

  // Game loop
  useEffect(() => {
    if (!gameActive) return;

    let lastTime = performance.now();

    const gameLoop = (currentTime) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      updateGame(deltaTime);
      drawGame();

      animationFrameIdRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameIdRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [gameActive, dimensions]);

  // Game functions
  const handleJump = () => {
    if (showStartScreen) {
      startGame();
    } else if (gameActive) {
      birdRef.current.velocity = JUMP_FORCE;
    } else if (showGameOver) {
      startGame();
    }
  };

  const startGame = () => {
    setShowStartScreen(false);
    setShowGameOver(false);
    setGameActive(true);
    setScore(0);
    scoreRef.current = 0;

    birdRef.current = {
      x: 100,
      y: dimensions.height / 2,
      width: 50,
      height: 70,
      velocity: 0,
    };

    pipesRef.current = [];
    floorXRef.current = 0;
    passedPipesRef.current = new Set();
    lastPipeTimeRef.current = 0;
  };

  const endGame = () => {
    setGameActive(false);
    setShowGameOver(true);
  };

  const createPipe = () => {
    const randomHeight =
      PIPE_HEIGHTS[Math.floor(Math.random() * PIPE_HEIGHTS.length)];
    return [
      {
        // Top pipe
        x: dimensions.width,
        y: 0,
        width: 80,
        height: randomHeight - PIPE_GAP,
        passed: false,
      },
      {
        // Bottom pipe
        x: dimensions.width,
        y: randomHeight,
        width: 80,
        height: dimensions.height - randomHeight - FLOOR_HEIGHT,
        passed: false,
      },
    ];
  };

  const updateGame = (deltaTime) => {
    // Update bird
    const bird = birdRef.current;
    bird.velocity += GRAVITY;
    bird.y += bird.velocity;

    // Spawn pipes
    lastPipeTimeRef.current += deltaTime;
    if (lastPipeTimeRef.current >= PIPE_SPAWN_TIME) {
      lastPipeTimeRef.current = 0;
      pipesRef.current.push(...createPipe());
    }

    // Update pipes
    pipesRef.current = pipesRef.current
      .map((pipe) => ({
        ...pipe,
        x: pipe.x - PIPE_SPEED,
      }))
      .filter((pipe) => pipe.x + pipe.width > 0);

    // Score calculation
    pipesRef.current.forEach((pipe) => {
      if (!pipe.passed && pipe.x + pipe.width < bird.x) {
        pipe.passed = true;
        if (!passedPipesRef.current.has(pipe)) {
          passedPipesRef.current.add(pipe);
          scoreRef.current += 0.5;
          if (Math.floor(scoreRef.current) > Math.floor(score)) {
            setScore(Math.floor(scoreRef.current));
          }
        }
      }
    });

    // Check collisions
    if (checkCollisions()) {
      endGame();
      return;
    }

    // Update floor
    floorXRef.current =
      floorXRef.current - 1 <= -dimensions.width ? 0 : floorXRef.current - 1;
  };

  const checkCollisions = () => {
    const bird = birdRef.current;

    // Check floor/ceiling collision
    if (
      bird.y <= 0 ||
      bird.y + bird.height >= dimensions.height - FLOOR_HEIGHT
    ) {
      return true;
    }

    // Check pipe collisions
    for (const pipe of pipesRef.current) {
      if (
        bird.x < pipe.x + pipe.width &&
        bird.x + bird.width > pipe.x &&
        bird.y < pipe.y + pipe.height &&
        bird.y + bird.height > pipe.y
      ) {
        return true;
      }
    }

    return false;
  };

  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Draw background
    if (imagesRef.current.background) {
      ctx.drawImage(
        imagesRef.current.background,
        0,
        0,
        dimensions.width,
        dimensions.height
      );
    }

    // Draw pipes
    if (imagesRef.current.pipe) {
      pipesRef.current.forEach((pipe) => {
        if (pipe.y === 0) {
          // Top pipe (flipped)
          ctx.save();
          ctx.scale(1, -1);
          ctx.drawImage(
            imagesRef.current.pipe,
            pipe.x,
            -pipe.height,
            pipe.width,
            pipe.height
          );
          ctx.restore();
        } else {
          // Bottom pipe
          ctx.drawImage(
            imagesRef.current.pipe,
            pipe.x,
            pipe.y,
            pipe.width,
            pipe.height
          );
        }
      });
    }

    // Draw bird
    if (imagesRef.current.bird) {
      const bird = birdRef.current;
      ctx.drawImage(
        imagesRef.current.bird,
        bird.x,
        bird.y,
        bird.width,
        bird.height
      );
    }

    // Draw floor
    if (imagesRef.current.floor) {
      const floorX = floorXRef.current;
      ctx.drawImage(
        imagesRef.current.floor,
        floorX,
        dimensions.height - FLOOR_HEIGHT,
        dimensions.width,
        FLOOR_HEIGHT
      );
      ctx.drawImage(
        imagesRef.current.floor,
        floorX + dimensions.width,
        dimensions.height - FLOOR_HEIGHT,
        dimensions.width,
        FLOOR_HEIGHT
      );
    }

    // Draw score
    ctx.fillStyle = "white";
    ctx.font = `${Math.max(24, dimensions.width / 20)}px Arial`;
    ctx.fillText(`Score: ${Math.floor(scoreRef.current)}`, 20, 50);
  };

  const handleStartClick = () => {
    startGame();
  };

  const handleRestartClick = () => {
    startGame();
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100vw",
        backgroundColor: "#222",
        overflow: "hidden",
        touchAction: "none",
      }}
    >
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{
          border: "2px solid #444",
          backgroundColor: "#000",
          maxWidth: "100%",
          maxHeight: "100%",
          touchAction: "none",
        }}
      />

      {/* Start Screen */}
      {showStartScreen && (
        <div
          style={{
            position: "absolute",
            width: dimensions.width,
            height: dimensions.height,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            color: "white",
            pointerEvents: "auto",
          }}
        >
          <h1
            style={{
              fontSize: `${Math.min(48, dimensions.width / 10)}px`,
              marginBottom: "20px",
            }}
          >
            Flappish Bird
          </h1>
          <p
            style={{
              fontSize: `${Math.min(24, dimensions.width / 20)}px`,
              marginBottom: "40px",
            }}
          >
            {window.innerWidth < 768
              ? "Tap anywhere to flap!"
              : "Press SPACE or click to flap!"}
          </p>
          <button
            onClick={handleStartClick}
            style={{
              marginTop: "20px",
              padding: "15px 30px",
              fontSize: `${Math.min(24, dimensions.width / 20)}px`,
              cursor: "pointer",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "5px",
            }}
          >
            Start Game
          </button>
        </div>
      )}

      {/* Game Over Screen */}
      {showGameOver && (
        <div
          style={{
            position: "absolute",
            width: dimensions.width,
            height: dimensions.height,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            color: "white",
            pointerEvents: "auto",
          }}
        >
          <h1
            style={{
              color: "#f44336",
              fontSize: `${Math.min(48, dimensions.width / 10)}px`,
            }}
          >
            Game Over
          </h1>
          <p
            style={{
              fontSize: `${Math.min(36, dimensions.width / 15)}px`,
              margin: "20px 0",
            }}
          >
            Score: {Math.floor(score)}
          </p>
          <button
            onClick={handleRestartClick}
            style={{
              padding: "15px 30px",
              fontSize: `${Math.min(24, dimensions.width / 20)}px`,
              cursor: "pointer",
              backgroundColor: "#2196F3",
              color: "white",
              border: "none",
              borderRadius: "5px",
              margin: "10px",
            }}
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
};

export default FlappishGame;

// import React, { useState, useEffect, useRef } from "react";
// import backgroundImg from "./assets/background.png";
// import floorImg from "./assets/floor.png";
// import birdImg from "./assets/bird3.png";
// import pipeImg from "./assets/pipes.png";

// const FlappishGame = () => {
//   // Game constants
//   const [dimensions, setDimensions] = useState({
//     width: Math.min(1100, window.innerWidth - 40),
//     height: Math.min(706, window.innerHeight - 40),
//   });

//   // const HEIGHT = 706;
//   // const WIDTH = 1100;
//   const JUMP_FORCE = -10;
//   const GRAVITY = 0.4;
//   const PIPE_SPEED = 3; // Reduced for better gameplay
//   const PIPE_SPAWN_TIME = 1800; // Milliseconds between pipes
//   const PIPE_HEIGHTS = [400, 450, 500];
//   const PIPE_GAP = 250;
//   const FLOOR_HEIGHT = 100;

//   // Game state
//   const [gameActive, setGameActive] = useState(false);
//   const [showStartScreen, setShowStartScreen] = useState(true);
//   const [showGameOver, setShowGameOver] = useState(false);
//   const [score, setScore] = useState(0);
//   const scoreRef = useRef(0);

//   // Game objects (using refs for performance)
//   const birdRef = useRef({
//     x: 100,
//     y: dimensions.height / 2,
//     width: 50,
//     height: 70,
//     velocity: 0,
//   });

//   const pipesRef = useRef([]);
//   const floorXRef = useRef(0);
//   const lastPipeTimeRef = useRef(0);
//   const passedPipesRef = useRef(new Set());
//   const animationFrameIdRef = useRef(null);
//   const imagesRef = useRef({
//     background: null,
//     floor: null,
//     bird: null,
//     pipe: null,
//   });

//   // Canvas ref
//   const canvasRef = useRef(null);

//   // Load images
//   useEffect(() => {
//     const loadImages = async () => {
//       const bg = new Image();
//       bg.src = backgroundImg;

//       const floor = new Image();
//       floor.src = floorImg;

//       const bird = new Image();
//       bird.src = birdImg;

//       const pipe = new Image();
//       pipe.src = pipeImg;

//       await Promise.all([
//         new Promise((resolve) => {
//           bg.onload = resolve;
//         }),
//         new Promise((resolve) => {
//           floor.onload = resolve;
//         }),
//         new Promise((resolve) => {
//           bird.onload = resolve;
//         }),
//         new Promise((resolve) => {
//           pipe.onload = resolve;
//         }),
//       ]);

//       imagesRef.current = { background: bg, floor, bird, pipe };
//     };

//     loadImages();

//     return () => {
//       if (animationFrameIdRef.current) {
//         cancelAnimationFrame(animationFrameIdRef.current);
//       }
//     };
//   }, []);

//   // Handle keyboard input
//   useEffect(() => {
//     const handleKeyDown = (e) => {
//       if (e.code === "Space") {
//         e.preventDefault();
//         if (showStartScreen) {
//           startGame();
//         } else if (gameActive) {
//           birdRef.current.velocity = JUMP_FORCE;
//         } else if (showGameOver) {
//           startGame();
//         }
//       }
//     };

//     window.addEventListener("keydown", handleKeyDown);
//     return () => window.removeEventListener("keydown", handleKeyDown);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [showStartScreen, gameActive, showGameOver]);

//   // Game loop
//   useEffect(() => {
//     if (!gameActive) return;

//     let lastTime = performance.now();

//     const gameLoop = (currentTime) => {
//       const deltaTime = currentTime - lastTime;
//       lastTime = currentTime;

//       updateGame(deltaTime);
//       drawGame();

//       animationFrameIdRef.current = requestAnimationFrame(gameLoop);
//     };

//     animationFrameIdRef.current = requestAnimationFrame(gameLoop);

//     return () => {
//       if (animationFrameIdRef.current) {
//         cancelAnimationFrame(animationFrameIdRef.current);
//       }
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [gameActive]);

//   // Game functions
//   const startGame = () => {
//     setShowStartScreen(false);
//     setShowGameOver(false);
//     setGameActive(true);
//     setScore(0);

//     birdRef.current = {
//       x: 100,
//       y: dimensions.height / 2,
//       width: 50,
//       height: 70,
//       velocity: 0,
//     };

//     pipesRef.current = [];
//     floorXRef.current = 0;
//     passedPipesRef.current = new Set();
//     lastPipeTimeRef.current = 0;
//   };

//   const endGame = () => {
//     setGameActive(false);
//     setShowGameOver(true);
//   };

//   const createPipe = () => {
//     const randomHeight =
//       PIPE_HEIGHTS[Math.floor(Math.random() * PIPE_HEIGHTS.length)];
//     return [
//       {
//         // Top pipe
//         x: dimensions.width,
//         y: 0,
//         width: 80,
//         height: randomHeight - PIPE_GAP,
//         passed: false,
//       },
//       {
//         // Bottom pipe
//         x: dimensions.width,
//         y: randomHeight,
//         width: 80,
//         height: dimensions.height - randomHeight,
//         passed: false,
//       },
//     ];
//   };

//   const updateGame = (deltaTime) => {
//     // Update bird
//     const bird = birdRef.current;
//     bird.velocity += GRAVITY;
//     bird.y += bird.velocity;

//     // Spawn pipes
//     lastPipeTimeRef.current += deltaTime;
//     if (lastPipeTimeRef.current >= PIPE_SPAWN_TIME) {
//       lastPipeTimeRef.current = 0;
//       pipesRef.current.push(...createPipe());
//     }

//     // Update pipes
//     pipesRef.current = pipesRef.current
//       .map((pipe) => ({
//         ...pipe,
//         x: pipe.x - PIPE_SPEED,
//       }))
//       .filter((pipe) => pipe.x + pipe.width > 0);

//     // Score calculation
//     pipesRef.current.forEach((pipe) => {
//       if (!pipe.passed && pipe.x + pipe.width < bird.x) {
//         pipe.passed = true;
//         if (!passedPipesRef.current.has(pipe)) {
//           passedPipesRef.current.add(pipe);
//           scoreRef.current += 0.5;
//           if (Math.floor(scoreRef.current) > Math.floor(score)) {
//             setScore(Math.floor(scoreRef.current));
//           }
//           //setScore((prev) => prev + 0.5); // Each pair counts as 1 (0.5 per pipe)
//         }
//       }
//     });

//     // Check collisions
//     if (checkCollisions()) {
//       endGame();
//       return;
//     }

//     // Update floor
//     floorXRef.current =
//       floorXRef.current - 1 <= -dimensions.width ? 0 : floorXRef.current - 1;
//   };

//   const checkCollisions = () => {
//     const bird = birdRef.current;

//     // Check floor/ceiling collision
//     if (
//       bird.y <= 0 ||
//       bird.y + bird.height >= dimensions.height - FLOOR_HEIGHT
//     ) {
//       return true;
//     }

//     // Check pipe collisions
//     for (const pipe of pipesRef.current) {
//       if (
//         bird.x < pipe.x + pipe.width &&
//         bird.x + bird.width > pipe.x &&
//         bird.y < pipe.y + pipe.height &&
//         bird.y + bird.height > pipe.y
//       ) {
//         return true;
//       }
//     }

//     return false;
//   };

//   const drawGame = () => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;

//     const ctx = canvas.getContext("2d");
//     if (!ctx) return;

//     // Clear canvas
//     ctx.clearRect(0, 0, dimensions.width, dimensions.height);

//     // Draw background
//     if (imagesRef.current.background) {
//       ctx.drawImage(
//         imagesRef.current.background,
//         0,
//         0,
//         dimensions.width,
//         dimensions.height
//       );
//     }

//     // Draw pipes
//     if (imagesRef.current.pipe) {
//       pipesRef.current.forEach((pipe) => {
//         if (pipe.y === 0) {
//           // Top pipe (flipped)
//           ctx.save();
//           ctx.scale(1, -1);
//           ctx.drawImage(
//             imagesRef.current.pipe,
//             pipe.x,
//             -pipe.height,
//             pipe.width,
//             pipe.height
//           );
//           ctx.restore();
//         } else {
//           // Bottom pipe
//           ctx.drawImage(
//             imagesRef.current.pipe,
//             pipe.x,
//             pipe.y,
//             pipe.width,
//             pipe.height
//           );
//         }
//       });
//     }

//     // Draw bird
//     if (imagesRef.current.bird) {
//       const bird = birdRef.current;
//       ctx.drawImage(
//         imagesRef.current.bird,
//         bird.x,
//         bird.y,
//         bird.width,
//         bird.height
//       );
//     }

//     // Draw floor
//     if (imagesRef.current.floor) {
//       const floorX = floorXRef.current;
//       ctx.drawImage(
//         imagesRef.current.floor,
//         floorX,
//         dimensions.height - FLOOR_HEIGHT,
//         dimensions.width,
//         FLOOR_HEIGHT
//       );
//       ctx.drawImage(
//         imagesRef.current.floor,
//         floorX + dimensions.width,
//         dimensions.height - FLOOR_HEIGHT,
//         dimensions.width,
//         FLOOR_HEIGHT
//       );
//     }

//     // Draw score
//     ctx.fillStyle = "white";
//     ctx.font = "36px Arial";
//     //ctx.fillText(`Score: ${Math.floor(score)}`, 20, 50);
//     ctx.fillText(`Score: ${Math.floor(scoreRef.current)}`, 20, 50);
//   };

//   const handleStartClick = () => {
//     startGame();
//     setScore(0);
//     scoreRef.current = 0;
//   };

//   const handleRestartClick = () => {
//     startGame();
//   };

//   return (
//     <div
//       style={{
//         display: "flex",
//         justifyContent: "center",
//         alignItems: "center",
//         height: "100vh",
//         backgroundColor: "#222",
//       }}
//     >
//       <canvas
//         ref={canvasRef}
//         width={dimensions.width}
//         height={dimensions.height}
//         style={{
//           border: "2px solid #444",
//           backgroundColor: "#000",
//         }}
//       />

//       {/* Start Screen */}
//       {showStartScreen && (
//         <div
//           style={{
//             position: "absolute",
//             width: dimensions.width,
//             height: dimensions.height,
//             backgroundColor: "rgba(0, 0, 0, 0.7)",
//             display: "flex",
//             flexDirection: "column",
//             justifyContent: "center",
//             alignItems: "center",
//             color: "white",
//             pointerEvents: "auto",
//           }}
//         >
//           <h1 style={{ fontSize: "48px", marginBottom: "20px" }}>
//             Flappish Bird
//           </h1>
//           <p style={{ fontSize: "24px", marginBottom: "40px" }}>
//             Press SPACE to flap!
//           </p>
//           <button
//             onClick={handleStartClick}
//             style={{
//               marginTop: "20px",
//               padding: "15px 30px",
//               fontSize: "24px",
//               cursor: "pointer",
//               backgroundColor: "#4CAF50",
//               color: "white",
//               border: "none",
//               borderRadius: "5px",
//             }}
//           >
//             Start Game
//           </button>
//         </div>
//       )}

//       {/* Game Over Screen */}
//       {showGameOver && (
//         <div
//           style={{
//             position: "absolute",
//             width: dimensions.width,
//             height: dimensions.height,
//             backgroundColor: "rgba(0, 0, 0, 0.8)",
//             display: "flex",
//             flexDirection: "column",
//             justifyContent: "center",
//             alignItems: "center",
//             color: "white",
//             pointerEvents: "auto",
//           }}
//         >
//           <h1 style={{ color: "#f44336", fontSize: "48px" }}>Game Over</h1>
//           <p style={{ fontSize: "36px", margin: "20px 0" }}>
//             Score: {Math.floor(score)}
//           </p>
//           <button
//             onClick={handleRestartClick}
//             style={{
//               padding: "15px 30px",
//               fontSize: "24px",
//               cursor: "pointer",
//               backgroundColor: "#2196F3",
//               color: "white",
//               border: "none",
//               borderRadius: "5px",
//               margin: "10px",
//             }}
//           >
//             Play Again
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default FlappishGame;
