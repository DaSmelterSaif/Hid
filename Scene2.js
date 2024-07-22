class Scene2 extends Phaser.Scene {
  constructor() {
    super("playgame");
  }

  create() {
    console.log("Scene2 activated!");

    this.enter = this.input.keyboard.addKey("ENTER");
    this.enterJustDown = false;
    // Set at 500 for testing purposes:
    this.giantSpawnLocationX = Phaser.Math.Between(2000, 3000);
    this.playerIsAlive = true;
    this.playerRecentXPosition = null;
    this.playerIsHiding = false;
    // Is set often to 400 for testing purposes:
    this.playerVelocity = 50; // Return to 50 after finishing test
    this.giantWalkVelocity = 40;
    this.giantChaseVelocity = 60;
    this.giantSearchVelocity = 55;
    this.giantDetectRadius = 400;
    this.giantLoseRadius = 1500;
    this.searchTime = 20000; // in ms
    this.hidingDistance = 0;
    this.hidingDetectionRange = 300;
    this.randomIdleTimeFrom = 2; // in seconds
    this.randomIdleTimeTo = 6; // in seconds (inclusive)
    this.randomWalkTimeFrom = 10; // in seconds
    this.randomWalkTimeTo = 21; // in seconds (inclusive)
    this.giantWalkIdleCycleFinished = false;
    this.idleTimer = null;
    this.walkTimer = null;
    this.giantSeesThePlayer = false;
    this.giantSearchesForPlayer = false;

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
    this.bush.create(1300, 505, "bush").setScale(2).refreshBody();
    this.bush.create(1700, 505, "bush").setScale(2).refreshBody();
    this.bush.create(2100, 505, "bush").setScale(2).refreshBody();
    this.bush.create(2500, 505, "bush").setScale(2).refreshBody();
    this.bush.create(2900, 505, "bush").setScale(2).refreshBody();
    this.bush.create(3300, 505, "bush").setScale(2).refreshBody();
    this.bush.create(3700, 505, "bush").setScale(2).refreshBody();

    // The ground stretches to the world bounds
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
    // Commented often for testing purposes:
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
    this.giantWalkIdleCycle();
  }

  /**
   * Moves the giant with a given speed at a given direction
   *
   * @param {number} velocity The velocity of the giant
   * @param {number} direction The direction the giant is moving in
   */
  giantMove(velocity, direction) {
    this.giant.setVelocityX(velocity * direction);
  }

  // TODO - Make it so that the giant doesn't approach the world bounds
  giantWalkIdleCycle() {
    this.randomDirection = Phaser.Math.Between(0, 1) == 0 ? -1 : 1;
    this.randomIdleTime =
      Phaser.Math.Between(this.randomIdleTimeFrom, this.randomIdleTimeTo) *
      1000;
    this.randomWalkTime =
      Phaser.Math.Between(this.randomWalkTimeFrom, this.randomWalkTimeTo) *
      1000;

    this.giant.setVelocityX(0);

    console.log("Idle timer started!");
    this.idleTimer = setTimeout(() => {
      this.giantMove(this.giantWalkVelocity, this.randomDirection);

      console.log("Walk timer started!");
      this.walkTimer = setTimeout(() => {
        this.giantWalkIdleCycleFinished = true;
      }, this.randomWalkTime);
    }, this.randomIdleTime);
  }

  giantDetectsPlayer() {
    this.hidingDistance = this.playerRecentXPosition - this.giant.x;

    this.playerIsWithinRange =
      this.playerIsAlive &&
      !this.playerIsHiding &&
      Math.abs(this.distanceBetweenPlayerAndGiant) < this.giantDetectRadius;
    this.playerIsWithinBushRange =
      this.giantSeesThePlayer &&
      this.playerIsHiding &&
      Math.abs(this.hidingDistance) < this.hidingDetectionRange;
    this.playerEscaped =
      this.giantSeesThePlayer &&
      Math.abs(this.distanceBetweenPlayerAndGiant) > this.giantLoseRadius;
    this.playerHid =
      this.giantSeesThePlayer &&
      this.playerIsHiding &&
      Math.abs(this.hidingDistance) > this.hidingDetectionRange;

    if (this.playerIsWithinRange || this.playerIsWithinBushRange) {
      this.giantSeesThePlayer = true;
      this.giantWalkIdleCycleFinished = false;
      clearTimeout(this.idleTimer);
      clearTimeout(this.walkTimer);
      console.log("Player detected!");
    } else if (this.playerEscaped || this.playerHid) {
      this.giantSeesThePlayer = false;
      this.giantSearchesForPlayer = true;
      console.log("Player lost!");
    } else if (!this.playerIsAlive && this.giantSeesThePlayer) {
      this.giantSeesThePlayer = false;
      this.giantWalkIdleCycleFinished = true;
    }
  }

  /**
   * Causes the giant to walk towards the player's
   * direction
   */
  giantChasePlayer() {
    if (this.distanceBetweenPlayerAndGiant < 0) {
      this.giant.setVelocityX(-this.giantChaseVelocity);
    } else if (this.distanceBetweenPlayerAndGiant > 0) {
      this.giant.setVelocityX(this.giantChaseVelocity);
    } else {
      this.giant.setVelocityX(0);
    }
  }

  giantSearchForPlayer() {
    if (!this.alreadyStartedSearching) {
      console.log("Searching for player...");
      this.giant.setVelocityX(this.direction * this.giantSearchVelocity);

      this.time.addEvent({
        delay: this.searchTime,
        callback: () => {
          this.giantSearchesForPlayer = false;
          this.alreadyStartedSearching = false;
          this.giantWalkIdleCycleFinished = true;
          console.log("Search ended!");
        },
      });
    }
  }

  /**
   * Causes the player to die if the player is not hiding.
   * Also, causes the player to fly up and rotate when he
   * dies.
   */
  giantKill() {
    if (this.playerIsAlive && !this.playerIsHiding) {
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
    } else if (
      this.playerIsAlive &&
      this.playerIsHiding &&
      this.giantSeesThePlayer
    ) {
      this.revealPlayer();
    }
  }

  /**
   * Allows the player to move to the left or right
   * if not dead and not hiding. Uses arrow keys.
   * Depends on createCursorKeys method from Phaser.
   */
  playerMove() {
    if (this.playerIsAlive) {
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
    //Updates the distance between the player and the giant
    this.distanceBetweenPlayerAndGiant = Math.round(
      this.player.x - this.giant.x
    );
    if (this.distanceBetweenPlayerAndGiant < 0) {
      this.direction = -1;
    } else {
      this.direction = 1;
    }

    this.playerMove();
    this.giantDetectsPlayer();

    // Repeats the giant's walk-idle cycle
    if (this.giantWalkIdleCycleFinished) {
      this.giantWalkIdleCycleFinished = false;
      this.giantWalkIdleCycle();
    }

    if (this.giantSeesThePlayer) {
      this.giantChasePlayer();
    } else if (!this.giantSeesThePlayer && this.giantSearchesForPlayer) {
      this.giantSearchForPlayer();
      this.alreadyStartedSearching = true;
    }

    // Friction for when the player dies
    if (!this.playerIsAlive) {
      this.player.setDragX(15);
    }
  }
}
