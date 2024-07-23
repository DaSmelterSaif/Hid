class Scene3 extends Phaser.Scene {
  constructor() {
    super("gameover");
  }

  create() {
    this.add.text(400, 300, "GAME OVER!");
  }
}
