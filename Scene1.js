class Scene1 extends Phaser.Scene {
  constructor() {
    super("bootgame");
  }
  preload() {
    this.load.image("player", "assets/player.png");
    this.load.image("giant", "assets/giant.png");
    this.load.image("platform", "assets/platform.png");
    this.load.image("background", "assets/background.png");
    this.load.image("bush", "assets/bush.png");
  }

  create() {
    console.log("Scene1 activated!");
    this.add.text(30, 30, "Loading game...");
    this.scene.start("playgame");
  }
}
