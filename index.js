const container = document.querySelector(".container");
const button = document.querySelector(".btn-start");

const generateMaze = (cellsVertical, cellsHorizontal) => {
  const { body } = document;
  body.querySelector("canvas") ? body.removeChild(body.querySelector("canvas")) : "";

  const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

  const shuffle = (arr) => {
    let counter = arr.length;

    while (counter > 0) {
      const index = Math.floor(Math.random() * counter);

      counter--;

      const temp = arr[counter];
      arr[counter] = arr[index];
      arr[index] = temp;
    }

    return arr;
  };

  const stepThroughCell = (row, column) => {
    // If I have visited the cell at [row, column], then return
    if (grid[row][column]) {
      return;
    }

    // Mark this cell as being visited
    grid[row][column] = true;

    // Assemble ramdomly-ordered list of neighbors
    const neighbors = shuffle([
      [row - 1, column, "up"],
      [row, column + 1, "right"],
      [row + 1, column, "down"],
      [row, column - 1, "left"],
    ]);

    // For each neighbor...
    for (let neighbor of neighbors) {
      const [nextRow, nextColumn, direction] = neighbor;

      // See if that neighbor is out of bonds
      if (
        nextRow < 0 ||
        nextRow >= cellsVertical ||
        nextColumn < 0 ||
        nextColumn >= cellsHorizontal
      ) {
        continue;
      }

      // If we have visited that neighbor, continue to the next neighbor
      if (grid[nextRow][nextColumn]) {
        continue;
      }

      // Remove a wall from either horizontals or verticals
      if (direction === "left") {
        verticals[row][column - 1] = true;
      } else if (direction === "right") {
        verticals[row][column] = true;
      } else if (direction === "up") {
        horizontals[row - 1][column] = true;
      } else if (direction === "down") {
        horizontals[row][column] = true;
      }

      stepThroughCell(nextRow, nextColumn);
    }
    // Visit that next cell
  };

  const width = window.innerWidth;
  const height = window.innerHeight;

  const unitLengthX = width / cellsHorizontal;
  const unitLengthY = height / cellsVertical;

  const engine = Engine.create();
  engine.world.gravity.y = 0;
  const { world } = engine;
  const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
      wireframes: false,
      width,
      height,
    },
  });
  Render.run(render);
  Runner.run(Runner.create(), engine);

  // Walls

  const walls = [
    Bodies.rectangle(width / 2, 0, width, 2, { isStatic: true }),
    Bodies.rectangle(width / 2, height, width, 2, { isStatic: true }),
    Bodies.rectangle(0, height / 2, 2, height, { isStatic: true }),
    Bodies.rectangle(width, height / 2, 2, height, { isStatic: true }),
  ];

  World.add(world, walls);

  // Maze generation

  const grid = Array(cellsVertical)
    .fill(null)
    .map(() => Array(cellsHorizontal).fill(false));

  const verticals = Array(cellsVertical)
    .fill(null)
    .map(() => Array(cellsHorizontal - 1).fill(false));

  const horizontals = Array(cellsVertical - 1)
    .fill(null)
    .map(() => Array(cellsHorizontal).fill(false));

  const startRow = Math.floor(Math.random() * cellsVertical);
  const startColumn = Math.floor(Math.random() * cellsHorizontal);

  stepThroughCell(startRow, startColumn);

  horizontals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
      if (open) return;

      const wall = Bodies.rectangle(
        columnIndex * unitLengthX + unitLengthX / 2,
        rowIndex * unitLengthY + unitLengthY,
        unitLengthX,
        5,
        {
          label: "wall",
          isStatic: true,
          render: {
            fillStyle: "red",
          },
        }
      );

      World.add(world, wall);
    });
  });

  verticals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
      if (open) return;

      const wall = Bodies.rectangle(
        columnIndex * unitLengthX + unitLengthX,
        rowIndex * unitLengthY + unitLengthY / 2,
        5,
        unitLengthY,
        {
          label: "wall",
          isStatic: true,
          render: {
            fillStyle: "red",
          },
        }
      );

      World.add(world, wall);
    });
  });

  // Goal
  goalSize = Math.min(unitLengthX, unitLengthY);
  const goal = Bodies.rectangle(
    width - unitLengthX / 2,
    height - unitLengthY / 2,
    0.75 * goalSize,
    0.75 * goalSize,
    {
      label: "goal",
      isStatic: true,
      render: {
        fillStyle: "green",
      },
    }
  );
  World.add(world, goal);

  // Ball

  const ballRadius = Math.min(unitLengthX, unitLengthY) / 4;
  const ball = Bodies.circle(unitLengthX / 2, unitLengthY / 2, ballRadius, {
    label: "ball",
    render: {
      fillStyle: "blue",
    },
  });
  World.add(world, ball);

  const ballSpeed = 5;
  document.addEventListener("keydown", (event) => {
    const { x, y } = ball.velocity;

    if (event.key === "w" || event.key === "ArrowUp") {
      Body.setVelocity(ball, { x, y: Math.max(y - ballSpeed, -ballSpeed) });
    }

    if (event.key === "d" || event.key === "ArrowRight") {
      Body.setVelocity(ball, { x: Math.min(x + ballSpeed, ballSpeed), y });
    }

    if (event.key === "s" || event.key === "ArrowDown") {
      Body.setVelocity(ball, { x, y: Math.min(y + ballSpeed, ballSpeed) });
    }

    if (event.key === "a" || event.key === "ArrowLeft") {
      Body.setVelocity(ball, { x: Math.max(x - ballSpeed, -ballSpeed), y });
    }
  });

  // Win Condition

  Events.on(engine, "collisionStart", (event) => {
    event.pairs.forEach((collision) => {
      console.log(event);
      const labels = ["ball", "goal"];

      if (labels.includes(collision.bodyA.label) && labels.includes(collision.bodyB.label)) {
        console.log("why");
        document.querySelector("canvas").classList.add("blur");
        container.classList.remove("hidden");
        engine.world.gravity.y = 1;
        document.querySelectorAll("input").forEach((el) => {
          el.disabled = false;
        });
        button.disabled = false;

        world.bodies.forEach((body) => {
          if (body.label === "wall") {
            Body.setStatic(body, false);
          }
        });
      }
    });
  });
};

const getChosenRadio = (name) => {
  const radios = document.getElementsByName(name);

  for (let i = 0; i < radios.length; i++) {
    if (radios[i].checked) {
      return radios[i];
    }
  }
};

document.querySelector(".btn-start").addEventListener("click", function () {
  const columns = Number(document.querySelector("#columns").value);
  const rows = Number(document.querySelector("#rows").value);
  const difficulty = getChosenRadio("difficulty").value;
  const theme = getChosenRadio("theme").value;

  container.classList.add("hidden");
  document.querySelectorAll("input").forEach((el) => {
    el.disabled = true;
  });
  this.disabled = true;

  generateMaze(columns, rows);
});

generateMaze(5, 5);
document.querySelector("canvas").classList.add("blur");
