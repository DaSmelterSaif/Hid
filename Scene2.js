class Scene2 extends Phaser.Scene {
  constructor() {
    super("playgame");
  }

  create() {
    console.log("Scene2 activated!");

    this.enter = this.input.keyboard.addKey("ENTER");
    this.enterJustDown = false;
    // Is redundant. Remove if found not needed in the future
    this.giantSawThePlayer = false;
    this.giantSpawnLocationX = Phaser.Math.Between(1000, 2000);
    this.giantWalkIdleCycleFinished = false;
    this.playerIsAlive = true;
    this.playerRecentXPosition = 0;
    this.playerIsHiding = false;
    this.playerVelocity = 400; // Return to 30 later
    this.giantWalkVelocity = 20;
    this.giantChaseVelocity = 40;
    this.giantSearchVelocity = 35;
    this.giantDetectRadius = 400;
    this.giantLoseRadius = 1500;
    this.giantStartedSearching = false;
    this.searchTime = 5000; // in ms
    this.dispatchedTimer = null;
    this.hidingDistance = 0;
    this.hidingDetectionRange = 300;

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
    if (this.playerIsAlive == true) {
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
    this.dispatchedTimer = "idle";
    this.idleTimer = this.time.addEvent({
      delay: this.waitTime,
      callback: () => {
        this.giantWalk();
      },
    });
  }

  giantWalk() {
    this.giant.setVelocityX(this.direction * this.giantWalkVelocity);
    this.dispatchedTimer = "walk";
    this.walkTimer = this.time.addEvent({
      delay: this.moveTime,
      callback: () => {
        this.giantWalkIdleCycleFinished = true;
      },
    });
  }

  giantDetect() {
    // Logic for this method:
    // if the giant saw the player and the player was alive and within range,
    // then chase him. Else if the giant saw the player and (the player
    // went out of range) or (the player hid in a bush and the player was a
    // distance of 500 or more), search for him.
    this.distance = this.player.x - this.giant.x;
    this.hidingDistance = this.playerRecentXPosition - this.giant.x;
    this.playerIsWithinGiantDetectRadius =
      !this.giantSawThePlayer &&
      this.playerIsAlive &&
      Math.abs(this.distance) <= this.giantDetectRadius;

    this.playerIsOutOfRange =
      this.giantSawThePlayer &&
      this.playerIsAlive &&
      (Math.abs(this.distance > this.giantLoseRadius) ||
        (this.playerIsHiding &&
          Math.abs(this.hidingDistance) > this.hidingDetectionRange));

    if (this.playerIsWithinGiantDetectRadius) {
      this.giantWalkIdleCycleFinished = false;
      this.giantSawThePlayer = true;
      this.stopWalkIdleCycle();
      this.giantChase();
    } else if (this.playerIsOutOfRange && !this.giantStartedSearching) {
      this.giantSawThePlayer = false;
      this.giantStartedSearching = true;
      this.giantSearch();
    }
    if (!this.playerIsAlive) {
      this.giantSawThePlayer = false;
      this.restoreWalkIdleCycle();
    }
  }

  stopWalkIdleCycle() {
    if (this.dispatchedTimer == "idle") {
      this.idleTimer.paused = true;
      console.log("Paused idleTimer");
    }
    if (this.dispatchedTimer == "walk") {
      this.walkTimer.paused = true;
      console.log("Paused walkTimer");
    }
  }

  restoreWalkIdleCycle() {
    if (this.dispatchedTimer == "idle") {
      this.giant.setVelocityX(0);
      this.idleTimer.paused = false;
      console.log("Resumed idleTimer");
    }
    if (this.dispatchedTimer == "walk") {
      this.giant.setVelocityX(this.direction * this.giantWalkVelocity);
      this.walkTimer.paused = false;
      console.log("Resumed walkTimer");
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

  giantSearch() {
    if (this.distance < 0) {
      this.giant.setVelocityX(-this.giantSearchVelocity);
    } else if (this.distance > 0) {
      this.giant.setVelocityX(this.giantSearchVelocity);
    }
    this.time.addEvent({
      delay: this.searchTime,
      callback: () => {
        this.giantStartedSearching = false;
        this.restoreWalkIdleCycle();
      },
    });
  }

  giantKill() {
    if (this.playerIsAlive == true) {
      if (!this.playerIsHiding) {
        this.playerIsAlive = false;
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

    if (this.playerIsAlive) {
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
