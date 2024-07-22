const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  scene: [Scene1, Scene2],
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 300 },
      debug: false,
    },
  },
  pixelArt: true,
};

window.onload = function () {
  const game = new Phaser.Game(config);
};
