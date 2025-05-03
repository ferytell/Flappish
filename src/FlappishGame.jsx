import React, { useState, useEffect, useRef } from "react";
import backgroundImg from "./assets/background.png";
import floorImg from "./assets/floor.png";
import birdImg from "./assets/bird3.png";
import pipeImg from "./assets/pipes.png";

const FlappishGame = () => {
  // Game constants
  const HEIGHT = 706;
  const WIDTH = 1100;
  const JUMP_FORCE = -10;
  const GRAVITY = 0.4;
  const PIPE_SPEED = 3; // Reduced for better gameplay
  const PIPE_SPAWN_TIME = 1800; // Milliseconds between pipes
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
    y: HEIGHT / 2,
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

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (showStartScreen) {
          startGame();
        } else if (gameActive) {
          birdRef.current.velocity = JUMP_FORCE;
        } else if (showGameOver) {
          startGame();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showStartScreen, gameActive, showGameOver]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameActive]);

  // Game functions
  const startGame = () => {
    setShowStartScreen(false);
    setShowGameOver(false);
    setGameActive(true);
    setScore(0);

    birdRef.current = {
      x: 100,
      y: HEIGHT / 2,
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
        x: WIDTH,
        y: 0,
        width: 80,
        height: randomHeight - PIPE_GAP,
        passed: false,
      },
      {
        // Bottom pipe
        x: WIDTH,
        y: randomHeight,
        width: 80,
        height: HEIGHT - randomHeight,
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
          //setScore((prev) => prev + 0.5); // Each pair counts as 1 (0.5 per pipe)
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
      floorXRef.current - 1 <= -WIDTH ? 0 : floorXRef.current - 1;
  };

  const checkCollisions = () => {
    const bird = birdRef.current;

    // Check floor/ceiling collision
    if (bird.y <= 0 || bird.y + bird.height >= HEIGHT - FLOOR_HEIGHT) {
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
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // Draw background
    if (imagesRef.current.background) {
      ctx.drawImage(imagesRef.current.background, 0, 0, WIDTH, HEIGHT);
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
        HEIGHT - FLOOR_HEIGHT,
        WIDTH,
        FLOOR_HEIGHT
      );
      ctx.drawImage(
        imagesRef.current.floor,
        floorX + WIDTH,
        HEIGHT - FLOOR_HEIGHT,
        WIDTH,
        FLOOR_HEIGHT
      );
    }

    // Draw score
    ctx.fillStyle = "white";
    ctx.font = "36px Arial";
    //ctx.fillText(`Score: ${Math.floor(score)}`, 20, 50);
    ctx.fillText(`Score: ${Math.floor(scoreRef.current)}`, 20, 50);
  };

  const handleStartClick = () => {
    startGame();
    setScore(0);
    scoreRef.current = 0;
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
        backgroundColor: "#222",
      }}
    >
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        style={{
          border: "2px solid #444",
          backgroundColor: "#000",
        }}
      />

      {/* Start Screen */}
      {showStartScreen && (
        <div
          style={{
            position: "absolute",
            width: WIDTH,
            height: HEIGHT,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            color: "white",
            pointerEvents: "auto",
          }}
        >
          <h1 style={{ fontSize: "48px", marginBottom: "20px" }}>
            Flappish Bird
          </h1>
          <p style={{ fontSize: "24px", marginBottom: "40px" }}>
            Press SPACE to flap!
          </p>
          <button
            onClick={handleStartClick}
            style={{
              marginTop: "20px",
              padding: "15px 30px",
              fontSize: "24px",
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
            width: WIDTH,
            height: HEIGHT,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            color: "white",
            pointerEvents: "auto",
          }}
        >
          <h1 style={{ color: "#f44336", fontSize: "48px" }}>Game Over</h1>
          <p style={{ fontSize: "36px", margin: "20px 0" }}>
            Score: {Math.floor(score)}
          </p>
          <button
            onClick={handleRestartClick}
            style={{
              padding: "15px 30px",
              fontSize: "24px",
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

// const FlappishGame = () => {
//   // Game constants
//   const HEIGHT = 706;
//   const WIDTH = 1100;
//   const GRAVITY = 0.4;
//   const JUMP_FORCE = -10;
//   const PIPE_SPEED = 5;
//   const PIPE_SPAWN_TIME = 600;
//   const PIPE_HEIGHTS = [400, 450, 500];
//   const PIPE_GAP = 300;

//   // Game state
//   const [gameActive, setGameActive] = useState(false);
//   const [score, setScore] = useState(0);
//   const [showStartScreen, setShowStartScreen] = useState(true);
//   const [birdPosition, setBirdPosition] = useState({ x: 100, y: HEIGHT / 2 });
//   const [birdVelocity, setBirdVelocity] = useState(0);
//   const [pipes, setPipes] = useState([]);
//   const [floorX, setFloorX] = useState(0);

//   // Refs
//   const canvasRef = useRef(null);
//   const animationFrameRef = useRef(null);
//   const lastPipeTimeRef = useRef(0);
//   const passedPipesRef = useRef(new Set());

//   // Load images
//   const [images, setImages] = useState({
//     background: null,
//     floor: null,
//     bird: null,
//     pipe: null,
//   });

//   // Load images on component mount
//   useEffect(() => {
//     const loadImages = async () => {
//       try {
//         const bgImg = new Image();
//         bgImg.src = "/assets/background.png";

//         const floorImg = new Image();
//         floorImg.src = "/assets/floor.png";

//         const birdImg = new Image();
//         birdImg.src = "/assets/bird3.png";

//         const pipeImg = new Image();
//         pipeImg.src = "/assets/pipes.png";

//         await Promise.all([
//           new Promise((resolve) => {
//             bgImg.onload = resolve;
//           }),
//           new Promise((resolve) => {
//             floorImg.onload = resolve;
//           }),
//           new Promise((resolve) => {
//             birdImg.onload = resolve;
//           }),
//           new Promise((resolve) => {
//             pipeImg.onload = resolve;
//           }),
//         ]);

//         setImages({
//           background: bgImg,
//           floor: floorImg,
//           bird: birdImg,
//           pipe: pipeImg,
//         });
//       } catch (error) {
//         console.error("Error loading images:", error);
//       }
//     };

//     loadImages();

//     return () => {
//       if (animationFrameRef.current) {
//         cancelAnimationFrame(animationFrameRef.current);
//       }
//     };
//   }, []);

//   // Handle keyboard input
//   useEffect(() => {
//     const handleKeyDown = (e) => {
//       if (e.code === "Space") {
//         if (showStartScreen) {
//           startGame();
//         } else if (gameActive) {
//           setBirdVelocity(JUMP_FORCE);
//         }
//       }
//     };

//     window.addEventListener("keydown", handleKeyDown);
//     return () => window.removeEventListener("keydown", handleKeyDown);
//   }, [showStartScreen, gameActive]);

//   // Game loop
//   useEffect(() => {
//     if (!gameActive || !images.background) return;

//     let lastTime = 0;

//     const gameLoop = (timestamp) => {
//       const deltaTime = timestamp - lastTime;
//       lastTime = timestamp;

//       updateGame(deltaTime);
//       drawGame();

//       animationFrameRef.current = requestAnimationFrame(gameLoop);
//     };

//     animationFrameRef.current = requestAnimationFrame(gameLoop);

//     return () => {
//       if (animationFrameRef.current) {
//         cancelAnimationFrame(animationFrameRef.current);
//       }
//     };
//   }, [gameActive, images]);

//   // Game functions
//   const startGame = () => {
//     setShowStartScreen(false);
//     setGameActive(true);
//     setBirdPosition({ x: 100, y: HEIGHT / 2 });
//     setBirdVelocity(0);
//     setPipes([]);
//     setScore(0);
//     passedPipesRef.current = new Set();
//     lastPipeTimeRef.current = 0;
//   };

//   const endGame = () => {
//     setGameActive(false);
//   };

//   const createPipe = () => {
//     const randomHeight =
//       PIPE_HEIGHTS[Math.floor(Math.random() * PIPE_HEIGHTS.length)];
//     const bottomPipe = {
//       x: WIDTH,
//       y: randomHeight,
//       width: 100,
//       height: HEIGHT - randomHeight,
//       passed: false,
//     };
//     const topPipe = {
//       x: WIDTH,
//       y: 0,
//       width: 100,
//       height: randomHeight - PIPE_GAP,
//       passed: false,
//     };
//     return [topPipe, bottomPipe];
//   };

//   const updateGame = (deltaTime) => {
//     // Update bird
//     setBirdVelocity((prev) => prev + GRAVITY);
//     setBirdPosition((prev) => ({
//       x: prev.x,
//       y: prev.y + prev.velocity,
//     }));

//     // Spawn pipes
//     lastPipeTimeRef.current += deltaTime;
//     if (lastPipeTimeRef.current >= PIPE_SPAWN_TIME) {
//       lastPipeTimeRef.current = 0;
//       setPipes((prev) => [...prev, ...createPipe()]);
//     }

//     // Update pipes
//     setPipes((prev) => {
//       const updatedPipes = prev
//         .map((pipe) => ({
//           ...pipe,
//           x: pipe.x - PIPE_SPEED,
//         }))
//         .filter((pipe) => pipe.x + pipe.width > 0);

//       // Check for passed pipes and update score
//       updatedPipes.forEach((pipe) => {
//         if (!pipe.passed && pipe.x + pipe.width < birdPosition.x) {
//           pipe.passed = true;
//           if (!passedPipesRef.current.has(pipe)) {
//             passedPipesRef.current.add(pipe);
//             setScore((prev) => prev + 0.5); // Each pair counts as 1 (0.5 per pipe)
//           }
//         }
//       });

//       return updatedPipes;
//     });

//     // Check collisions
//     if (checkCollisions()) {
//       endGame();
//     }

//     // Update floor
//     setFloorX((prev) => (prev - 1 <= -WIDTH ? 0 : prev - 1));
//   };

//   const checkCollisions = () => {
//     // Check floor/ceiling collision
//     if (birdPosition.y <= 0 || birdPosition.y + 70 >= HEIGHT - 100) {
//       return true;
//     }

//     // Check pipe collisions
//     const birdRect = {
//       x: birdPosition.x,
//       y: birdPosition.y,
//       width: 50,
//       height: 70,
//     };

//     for (const pipe of pipes) {
//       const pipeRect = {
//         x: pipe.x,
//         y: pipe.y,
//         width: pipe.width,
//         height: pipe.height,
//       };

//       if (
//         birdRect.x < pipeRect.x + pipeRect.width &&
//         birdRect.x + birdRect.width > pipeRect.x &&
//         birdRect.y < pipeRect.y + pipeRect.height &&
//         birdRect.y + birdRect.height > pipeRect.y
//       ) {
//         return true;
//       }
//     }

//     return false;
//   };

//   const drawGame = () => {
//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext("2d");

//     // Clear canvas
//     ctx.clearRect(0, 0, WIDTH, HEIGHT);

//     // Draw background
//     if (images.background) {
//       ctx.drawImage(images.background, 0, 0, WIDTH, HEIGHT);
//     }

//     // Draw pipes
//     pipes.forEach((pipe) => {
//       if (images.pipe) {
//         if (pipe.y === 0) {
//           // Top pipe
//           ctx.save();
//           ctx.translate(pipe.x, pipe.height);
//           ctx.scale(1, -1);
//           ctx.drawImage(images.pipe, 0, 0, pipe.width, pipe.height);
//           ctx.restore();
//         } else {
//           // Bottom pipe
//           ctx.drawImage(images.pipe, pipe.x, pipe.y, pipe.width, pipe.height);
//         }
//       }
//     });

//     // Draw bird
//     if (images.bird) {
//       ctx.drawImage(images.bird, birdPosition.x, birdPosition.y, 50, 70);
//     }

//     // Draw floor
//     if (images.floor) {
//       ctx.drawImage(images.floor, floorX, HEIGHT - 100, WIDTH, 100);
//       ctx.drawImage(images.floor, floorX + WIDTH, HEIGHT - 100, WIDTH, 100);
//     }

//     // Draw score
//     ctx.fillStyle = "white";
//     ctx.font = "36px Arial";
//     ctx.fillText(`Score: ${Math.floor(score)}`, 10, 40);
//   };

//   const handleStartClick = () => {
//     startGame();
//   };

//   const handleRestartClick = () => {
//     startGame();
//   };

//   const handleExitClick = () => {
//     // In a real app, you might want to navigate away or close the game
//     window.location.href = "/";
//   };

//   return (
//     <div
//       style={{
//         display: "flex",
//         justifyContent: "center",
//         alignItems: "center",
//         height: "100vh",
//       }}
//     >
//       <canvas
//         ref={canvasRef}
//         width={WIDTH}
//         height={HEIGHT}
//         style={{ border: "1px solid black" }}
//       />

//       {/* Start Screen */}
//       {showStartScreen && (
//         <div
//           style={{
//             position: "absolute",
//             width: WIDTH,
//             height: HEIGHT,
//             backgroundColor: "rgba(0, 0, 0, 0.7)",
//             display: "flex",
//             flexDirection: "column",
//             justifyContent: "center",
//             alignItems: "center",
//             color: "white",
//           }}
//         >
//           <h1>Welcome! Let's Play!</h1>
//           <p>Use SPACE to flap!</p>
//           <button
//             onClick={handleStartClick}
//             style={{
//               marginTop: "20px",
//               padding: "10px 20px",
//               fontSize: "20px",
//               cursor: "pointer",
//             }}
//           >
//             Start Game
//           </button>
//         </div>
//       )}

//       {/* Game Over Screen */}
//       {!gameActive && !showStartScreen && (
//         <div
//           style={{
//             position: "absolute",
//             width: WIDTH,
//             height: HEIGHT,
//             backgroundColor: "rgba(0, 0, 0, 0.7)",
//             display: "flex",
//             flexDirection: "column",
//             justifyContent: "center",
//             alignItems: "center",
//             color: "white",
//           }}
//         >
//           <h1 style={{ color: "red" }}>Game Over</h1>
//           <p>Final Score: {Math.floor(score)}</p>
//           <button
//             onClick={handleRestartClick}
//             style={{
//               marginTop: "20px",
//               padding: "10px 20px",
//               fontSize: "20px",
//               cursor: "pointer",
//             }}
//           >
//             Play Again
//           </button>
//           <button
//             onClick={handleExitClick}
//             style={{
//               marginTop: "10px",
//               padding: "10px 20px",
//               fontSize: "20px",
//               cursor: "pointer",
//             }}
//           >
//             Exit
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default FlappishGame;

// // import React, { useState, useEffect, useRef } from "react";

// // const FlappishGame = () => {
// //   // Game constants
// //   const HEIGHT = 706;
// //   const WIDTH = 1100;
// //   const GRAVITY = 0.4;
// //   const JUMP_FORCE = -10;
// //   const PIPE_SPEED = 5;
// //   const PIPE_SPAWN_TIME = 600;
// //   const PIPE_HEIGHTS = [400, 450, 500];
// //   const PIPE_GAP = 300;

// //   // Game state
// //   const [gameActive, setGameActive] = useState(false);
// //   const [score, setScore] = useState(0);
// //   const [showStartScreen, setShowStartScreen] = useState(true);
// //   const [birdPosition, setBirdPosition] = useState({ x: 100, y: HEIGHT / 2 });
// //   const [birdVelocity, setBirdVelocity] = useState(0);
// //   const [pipes, setPipes] = useState([]);
// //   const [floorX, setFloorX] = useState(0);

// //   // Refs
// //   const canvasRef = useRef(null);
// //   const animationFrameRef = useRef(null);
// //   const lastPipeTimeRef = useRef(0);
// //   const passedPipesRef = useRef(new Set());

// //   // Load images
// //   const [images, setImages] = useState({
// //     background: null,
// //     floor: null,
// //     bird: null,
// //     pipe: null,
// //   });

// //   // Load images on component mount
// //   useEffect(() => {
// //     const loadImages = async () => {
// //       try {
// //         const bgImg = new Image();
// //         bgImg.src = "/assets/background.png";
// //         console.log(bgImg, "testi g dofu");
// //         const floorImg = new Image();
// //         floorImg.src = "/assets/floor.png";

// //         const birdImg = new Image();
// //         birdImg.src = "/assets/bird3.png";

// //         const pipeImg = new Image();
// //         pipeImg.src = "/assets/pipes.png";

// //         await Promise.all([
// //           new Promise((resolve) => {
// //             bgImg.onload = resolve;
// //           }),
// //           new Promise((resolve) => {
// //             floorImg.onload = resolve;
// //           }),
// //           new Promise((resolve) => {
// //             birdImg.onload = resolve;
// //           }),
// //           new Promise((resolve) => {
// //             pipeImg.onload = resolve;
// //           }),
// //         ]);

// //         setImages({
// //           background: bgImg,
// //           floor: floorImg,
// //           bird: birdImg,
// //           pipe: pipeImg,
// //         });
// //       } catch (error) {
// //         console.error("Error loading images:", error);
// //       }
// //     };

// //     loadImages();

// //     return () => {
// //       if (animationFrameRef.current) {
// //         cancelAnimationFrame(animationFrameRef.current);
// //       }
// //     };
// //   }, []);

// //   // Handle keyboard input
// //   useEffect(() => {
// //     const handleKeyDown = (e) => {
// //       if (e.code === "Space") {
// //         if (showStartScreen) {
// //           startGame();
// //         } else if (gameActive) {
// //           setBirdVelocity(JUMP_FORCE);
// //         }
// //       }
// //     };

// //     window.addEventListener("keydown", handleKeyDown);
// //     return () => window.removeEventListener("keydown", handleKeyDown);
// //   }, [showStartScreen, gameActive]);

// //   // Game loop
// //   useEffect(() => {
// //     if (!gameActive || !images.background) return;

// //     let lastTime = 0;

// //     const gameLoop = (timestamp) => {
// //       const deltaTime = timestamp - lastTime;
// //       lastTime = timestamp;

// //       updateGame(deltaTime);
// //       drawGame();

// //       animationFrameRef.current = requestAnimationFrame(gameLoop);
// //     };

// //     animationFrameRef.current = requestAnimationFrame(gameLoop);

// //     return () => {
// //       if (animationFrameRef.current) {
// //         cancelAnimationFrame(animationFrameRef.current);
// //       }
// //     };
// //   }, [gameActive, images]);

// //   // Game functions
// //   const startGame = () => {
// //     setShowStartScreen(false);
// //     setGameActive(true);
// //     setBirdPosition({ x: 100, y: HEIGHT / 2 });
// //     setBirdVelocity(0);
// //     setPipes([]);
// //     setScore(0);
// //     passedPipesRef.current = new Set();
// //     lastPipeTimeRef.current = 0;
// //   };

// //   const endGame = () => {
// //     setGameActive(false);
// //   };

// //   const createPipe = () => {
// //     const randomHeight =
// //       PIPE_HEIGHTS[Math.floor(Math.random() * PIPE_HEIGHTS.length)];
// //     const bottomPipe = {
// //       x: WIDTH,
// //       y: randomHeight,
// //       width: 100,
// //       height: HEIGHT - randomHeight,
// //       passed: false,
// //     };
// //     const topPipe = {
// //       x: WIDTH,
// //       y: 0,
// //       width: 100,
// //       height: randomHeight - PIPE_GAP,
// //       passed: false,
// //     };
// //     return [topPipe, bottomPipe];
// //   };

// //   const updateGame = (deltaTime) => {
// //     // Update bird
// //     setBirdVelocity((prev) => prev + GRAVITY);
// //     setBirdPosition((prev) => ({
// //       x: prev.x,
// //       y: prev.y + prev.velocity,
// //     }));

// //     // Spawn pipes
// //     lastPipeTimeRef.current += deltaTime;
// //     if (lastPipeTimeRef.current >= PIPE_SPAWN_TIME) {
// //       lastPipeTimeRef.current = 0;
// //       setPipes((prev) => [...prev, ...createPipe()]);
// //     }

// //     // Update pipes
// //     setPipes((prev) => {
// //       const updatedPipes = prev
// //         .map((pipe) => ({
// //           ...pipe,
// //           x: pipe.x - PIPE_SPEED,
// //         }))
// //         .filter((pipe) => pipe.x + pipe.width > 0);

// //       // Check for passed pipes and update score
// //       updatedPipes.forEach((pipe) => {
// //         if (!pipe.passed && pipe.x + pipe.width < birdPosition.x) {
// //           pipe.passed = true;
// //           if (!passedPipesRef.current.has(pipe)) {
// //             passedPipesRef.current.add(pipe);
// //             setScore((prev) => prev + 0.5); // Each pair counts as 1 (0.5 per pipe)
// //           }
// //         }
// //       });

// //       return updatedPipes;
// //     });

// //     // Check collisions
// //     if (checkCollisions()) {
// //       endGame();
// //     }

// //     // Update floor
// //     setFloorX((prev) => (prev - 1 <= -WIDTH ? 0 : prev - 1));
// //   };

// //   const checkCollisions = () => {
// //     // Check floor/ceiling collision
// //     if (birdPosition.y <= 0 || birdPosition.y + 70 >= HEIGHT - 100) {
// //       return true;
// //     }

// //     // Check pipe collisions
// //     const birdRect = {
// //       x: birdPosition.x,
// //       y: birdPosition.y,
// //       width: 50,
// //       height: 70,
// //     };

// //     for (const pipe of pipes) {
// //       const pipeRect = {
// //         x: pipe.x,
// //         y: pipe.y,
// //         width: pipe.width,
// //         height: pipe.height,
// //       };

// //       if (
// //         birdRect.x < pipeRect.x + pipeRect.width &&
// //         birdRect.x + birdRect.width > pipeRect.x &&
// //         birdRect.y < pipeRect.y + pipeRect.height &&
// //         birdRect.y + birdRect.height > pipeRect.y
// //       ) {
// //         return true;
// //       }
// //     }

// //     return false;
// //   };

// //   const drawGame = () => {
// //     const canvas = canvasRef.current;
// //     const ctx = canvas.getContext("2d");

// //     // Clear canvas
// //     ctx.clearRect(0, 0, WIDTH, HEIGHT);

// //     // Draw background
// //     if (images.background) {
// //       ctx.drawImage(images.background, 0, 0, WIDTH, HEIGHT);
// //     }

// //     // Draw pipes
// //     pipes.forEach((pipe) => {
// //       if (images.pipe) {
// //         if (pipe.y === 0) {
// //           // Top pipe
// //           ctx.save();
// //           ctx.translate(pipe.x, pipe.height);
// //           ctx.scale(1, -1);
// //           ctx.drawImage(images.pipe, 0, 0, pipe.width, pipe.height);
// //           ctx.restore();
// //         } else {
// //           // Bottom pipe
// //           ctx.drawImage(images.pipe, pipe.x, pipe.y, pipe.width, pipe.height);
// //         }
// //       }
// //     });

// //     // Draw bird
// //     if (images.bird) {
// //       ctx.drawImage(images.bird, birdPosition.x, birdPosition.y, 50, 70);
// //     }

// //     // Draw floor
// //     if (images.floor) {
// //       ctx.drawImage(images.floor, floorX, HEIGHT - 100, WIDTH, 100);
// //       ctx.drawImage(images.floor, floorX + WIDTH, HEIGHT - 100, WIDTH, 100);
// //     }

// //     // Draw score
// //     ctx.fillStyle = "white";
// //     ctx.font = "36px Arial";
// //     ctx.fillText(`Score: ${Math.floor(score)}`, 10, 40);
// //   };

// //   const handleStartClick = () => {
// //     startGame();
// //   };

// //   const handleRestartClick = () => {
// //     startGame();
// //   };

// //   const handleExitClick = () => {
// //     // In a real app, you might want to navigate away or close the game
// //     window.location.href = "/";
// //   };

// //   return (
// //     <div
// //       style={{
// //         display: "flex",
// //         justifyContent: "center",
// //         alignItems: "center",
// //         height: "100vh",
// //       }}
// //     >
// //       <canvas
// //         ref={canvasRef}
// //         width={WIDTH}
// //         height={HEIGHT}
// //         style={{ border: "1px solid black" }}
// //       />

// //       {/* Start Screen */}
// //       {showStartScreen && (
// //         <div
// //           style={{
// //             position: "absolute",
// //             width: WIDTH,
// //             height: HEIGHT,
// //             backgroundColor: "rgba(0, 0, 0, 0.7)",
// //             display: "flex",
// //             flexDirection: "column",
// //             justifyContent: "center",
// //             alignItems: "center",
// //             color: "white",
// //           }}
// //         >
// //           <h1>Welcome! Let's Play!</h1>
// //           <p>Use SPACE to flap!</p>
// //           <button
// //             onClick={handleStartClick}
// //             style={{
// //               marginTop: "20px",
// //               padding: "10px 20px",
// //               fontSize: "20px",
// //               cursor: "pointer",
// //             }}
// //           >
// //             Start Game
// //           </button>
// //         </div>
// //       )}

// //       {/* Game Over Screen */}
// //       {!gameActive && !showStartScreen && (
// //         <div
// //           style={{
// //             position: "absolute",
// //             width: WIDTH,
// //             height: HEIGHT,
// //             backgroundColor: "rgba(0, 0, 0, 0.7)",
// //             display: "flex",
// //             flexDirection: "column",
// //             justifyContent: "center",
// //             alignItems: "center",
// //             color: "white",
// //           }}
// //         >
// //           <h1 style={{ color: "red" }}>Game Over</h1>
// //           <p>Final Score: {Math.floor(score)}</p>
// //           <button
// //             onClick={handleRestartClick}
// //             style={{
// //               marginTop: "20px",
// //               padding: "10px 20px",
// //               fontSize: "20px",
// //               cursor: "pointer",
// //             }}
// //           >
// //             Play Again
// //           </button>
// //           <button
// //             onClick={handleExitClick}
// //             style={{
// //               marginTop: "10px",
// //               padding: "10px 20px",
// //               fontSize: "20px",
// //               cursor: "pointer",
// //             }}
// //           >
// //             Exit
// //           </button>
// //         </div>
// //       )}
// //     </div>
// //   );
// // };

// // export default FlappishGame;
