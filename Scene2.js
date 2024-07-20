class Scene2 extends Phaser.Scene {
  constructor() {
    super("playgame");
  }

  create() {
    console.log("Scene2 activated!");

    this.enter = this.input.keyboard.addKey("ENTER");
    this.enterJustDown = false;
    this.giantSeesThePlayer = false;
    this.giantSpawnLocationX = Phaser.Math.Between(1000, 2000);
    this.giantWalkIdleCycleFinished = false;
    this.playerAlive = true;
    this.playerRecentXPosition = 0;
    this.playerIsHiding = false;
    this.playerVelocity = 400;
    this.giantWalkVelocity = 20;
    this.giantChaseVelocity = 40;
    this.giantDetectRadius = 400;
    this.giantLoseRadius = 1500;
    this.dispatchedTimer = null;

    this.physics.world.setBounds(0, -600, 4200, 1200);

    this.cursors = this.input.keyboard.createCursorKeys();

    this.background = this.add.tileSprite(
      0,
      0,
      this.physics.world.bounds.width,
      600,
      "background"
    );
    this.background.setOrigin(0, 0);

    this.bush = this.physics.add.staticGroup();
    this.bush.create(500, 505, "bush").setScale(2).refreshBody();
    this.bush.create(900, 505, "bush").setScale(2).refreshBody();

    this.platform = this.physics.add
      .staticImage(0, 600, "platform")
      .setOrigin(0, 1);
    const scale = this.physics.world.bounds.width / this.platform.width;
    this.platform.setScale(scale, 1).refreshBody();

    this.giant = this.physics.add
      .sprite(this.giantSpawnLocationX, 0, "giant")
      .setScale(2);
    this.player = this.physics.add.sprite(100, 500, "player").setScale(2);

    this.physics.add.collider(this.giant, this.platform);
    this.physics.add.collider(this.player, this.platform);
    this.physics.add.overlap(this.player, this.giant, () => {
      this.giantKill();
    });
    this.bushPlayerCollider = this.physics.add.overlap(
      this.player,
      this.bush,
      (player, bush) => {
        this.hideInBush(player, bush);
      }
    );

    this.player.setCollideWorldBounds(true);
    this.player.setBounce(0.2);
    this.giant.setCollideWorldBounds(true);

    this.cameras.main.startFollow(this.player, true);
    this.cameras.main.setBounds(
      0,
      -600,
      this.physics.world.bounds.width,
      this.physics.world.bounds.height
    );

    this.giantMove();

    this.idleTimer = this.time.addEvent();
    this.walkTimer = this.time.addEvent();
  }

  playerMove() {
    if (this.playerAlive == true) {
      if (!this.playerIsHiding) {
        if (this.cursors.right.isDown) {
          this.player.setVelocityX(this.playerVelocity);
        } else if (this.cursors.left.isDown) {
          this.player.setVelocityX(-this.playerVelocity);
        } else {
          this.player.setVelocityX(0);
        }
      }
    }
  }

  giantMove() {
    this.waitTime = Phaser.Math.Between(2, 6) * 1000;
    this.moveTime = Phaser.Math.Between(10, 21) * 1000;
    this.direction = Phaser.Math.Between(0, 1) == 0 ? -1 : 1;

    this.giantIdleThenWalk();
  }

  giantIdleThenWalk() {
    this.giant.setVelocityX(0);
    this.idleTimer = this.time.addEvent({
      delay: this.waitTime,
      callback: () => {
        this.giantWalk();
      },
    });
  }

  giantWalk() {
    this.giant.setVelocityX(this.direction * this.giantWalkVelocity);
    this.walkTimer = this.time.addEvent({
      delay: this.moveTime,
      callback: () => {
        this.giantWalkIdleCycleFinished = true;
      },
    });
  }

  giantDetect() {
    this.distance = this.player.x - this.giant.x;
    if (this.playerAlive && Math.abs(this.distance) <= this.giantDetectRadius) {
      this.giantWalkIdleCycleFinished = false;
      this.giantSeesThePlayer = true;
      this.stopWalkIdleCycle();
      this.giantChase();
    } else if (
      this.playerAlive &&
      Math.abs(this.distance) > this.giantLoseRadius
    ) {
      this.giantSeesThePlayer = false;
      this.restoreWalkIdleCycle();
    }
  }

  stopWalkIdleCycle() {
    if (this.idleTimer.hasDispatched) {
      this.idleTimer.paused = true;
      this.dispatchedTimer = "idle";
    }
    if (this.walkTimer.hasDispatched) {
      this.walkTimer.paused = true;
      this.dispatchedTimer = "walk";
    }
  }

  restoreWalkIdleCycle() {
    if (this.dispatchedTimer == "idle") {
      this.idleTimer.paused = false;
    }
    if (this.dispatchedTimer == "walk") {
      this.walkTimer.paused = false;
    }
  }

  giantChase() {
    if (this.distance < 0) {
      this.giant.setVelocityX(-this.giantChaseVelocity);
    } else if (this.distance > 0) {
      this.giant.setVelocityX(this.giantChaseVelocity);
    } else if (Math.round(this.distance) == 0) {
      this.giant.setVelocityX(0);
    }
  }

  giantKill() {
    if (this.playerAlive == true) {
      if (!this.playerIsHiding) {
        this.playerAlive = false;
        this.player.setVelocityY(-300);
        this.player.setAngularVelocity(-600);
        this.time.addEvent({
          delay: 1000,
          callback: () => {
            this.player.setAngularDrag(800);
          },
        });
        this.player.body.setSize(
          this.player.body.height / 2,
          this.player.body.width / 2
        );
      }
    }
  }

  hideInBush(player, collidedBush) {
    this.currentBushIndex = this.bush.getChildren().indexOf(collidedBush);
    this.enterJustDown = Phaser.Input.Keyboard.JustDown(this.enter);

    if (this.playerAlive) {
      if (this.enterJustDown) {
        if (!this.playerIsHiding) {
          this.hidePlayer();
        } else {
          this.revealPlayer();
        }
      }
    }
  }

  hidePlayer() {
    this.playerIsHiding = true;
    this.playerRecentXPosition = this.player.x;
    this.player.x = this.bush.children.entries[this.currentBushIndex].x;
    this.player.visible = false;
    this.player.setVelocityX(0);
  }

  revealPlayer() {
    this.playerIsHiding = false;
    this.player.x = this.playerRecentXPosition;
    this.player.visible = true;
  }

  update() {
    this.giantDetect();
    this.playerMove();
    if (this.giantWalkIdleCycleFinished) {
      this.giantWalkIdleCycleFinished = false;
      this.giantMove();
    }
  }
}
