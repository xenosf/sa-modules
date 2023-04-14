import Phaser from 'phaser';
import {
  CircleGameObject,
  GameObject,
  type InteractableGameObject,
  RectangleGameObject,
  ShapeGameObject,
  SpriteGameObject,
  TextGameObject,
  TriangleGameObject,
} from './gameobject';
import {
  DEBUG,
  gameTime,
  loopCount,
  userUpdateFunction,
} from './functions';
import {
  type TransformProps,
  type PositionXY,
} from './types';
import { AudioClip } from './audio';

type PhaserGameObject = Phaser.GameObjects.Sprite | Phaser.GameObjects.Text | Phaser.GameObjects.Shape;

// Store keys that are down in the Phaser Scene
// By default, this is empty, unless a key is down
export const inputKeysDown = new Set<string>();

// the current (mouse) pointer position in the canvas
export let pointerPosition: PositionXY;

// true if (left mouse button) pointer down, false otherwise
export let pointerPrimaryDown: boolean;
export let pointerSecondaryDown: boolean;

// Stores the IDs of the GameObjects that the pointer is over
export const pointerOverGameObjectsId = new Set<number>();

// Stores the debug information, which is reset every iteration of the update loop.
export const debugLogArray: Array<string> = Array.of();

const userGameStateArray: Array<any> = Array.of();

/**
 * The Phaser scene that parses the GameObjects and update loop created by the user,
 * into Phaser GameObjects, and Phaser updates.
 */
export class PhaserScene extends Phaser.Scene {
  constructor() {
    super('PhaserScene');
  }
  private sourceGameObjects;
  private phaserGameObjects = [] as (PhaserGameObject)[];
  private corsAssets;
  private sourceAudioClips;
  private phaserAudioClips;
  private rerenderGameObjects = true;
  private delayedKeyUpEvents = new Set<Function>();
  private runtimeError: boolean = false;
  // Handle debug information
  private debugLogText: Phaser.GameObjects.Text | undefined = undefined;


  init() {
    // console.log('phaser scene init()');
    this.sourceGameObjects = GameObject.getGameObjectsArray();
    this.sourceAudioClips = AudioClip.getAudioClipsArray();
    this.phaserAudioClips = [];
    this.corsAssets = new Set();
    // Disable context menu within the canvas
    this.game.canvas.oncontextmenu = (e) => e.preventDefault();
  }

  preload() {
    // Set the default path prefix
    this.load.setPath('https://source-academy-assets.s3-ap-southeast-1.amazonaws.com/');
    this.sourceGameObjects.forEach((gameObject) => {
      if (gameObject instanceof SpriteGameObject) {
        this.corsAssets.add(gameObject.getSprite().image_url);
      }
    });
    // Preload sprites (through Cross-Origin resource sharing (CORS))
    this.corsAssets.forEach((url) => {
      this.load.image(url, url);
    });
    // Preload audio
    this.sourceAudioClips.forEach((audioClip: AudioClip) => {
      this.load.audio(audioClip.getUrl(), audioClip.getUrl());
    });
  }

  create() {
    this.sourceGameObjects.forEach((gameObject) => {
      // Handle Creation of GameObjects
      const transformProps = gameObject.getTransform();
      // Create TextGameObject
      if (gameObject instanceof TextGameObject) {
        const text = gameObject.getText().text;

        this.phaserGameObjects.push(this.add.text(
          transformProps.position[0],
          transformProps.position[1],
          text,
        ));
        this.phaserGameObjects[gameObject.id].setOrigin(0.5, 0.5);
        if (gameObject.getHitboxState().hitboxActive) {
          this.phaserGameObjects[gameObject.id].setInteractive();
        }
      }
      // Create SpriteGameObject
      if (gameObject instanceof SpriteGameObject) {
        const url = gameObject.getSprite().image_url;
        this.phaserGameObjects.push(this.add.sprite(
          transformProps.position[0],
          transformProps.position[1],
          url,
        ));
        if (gameObject.getHitboxState().hitboxActive) {
          this.phaserGameObjects[gameObject.id].setInteractive();
        }
      }
      // Create ShapeGameObject
      if (gameObject instanceof ShapeGameObject) {
        if (gameObject instanceof RectangleGameObject) {
          const shape = gameObject.getShape();
          this.phaserGameObjects.push(this.add.rectangle(
            transformProps.position[0],
            transformProps.position[1],
            shape.width,
            shape.height,
          ));
          if (gameObject.getHitboxState().hitboxActive) {
            this.phaserGameObjects[gameObject.id].setInteractive();
          }
        }
        if (gameObject instanceof CircleGameObject) {
          const shape = gameObject.getShape();
          this.phaserGameObjects.push(this.add.circle(
            transformProps.position[0],
            transformProps.position[1],
            shape.radius,
          ));
          if (gameObject.getHitboxState().hitboxActive) {
            this.phaserGameObjects[gameObject.id].setInteractive(
              new Phaser.Geom.Circle(
                shape.radius,
                shape.radius,
                shape.radius,
              ), Phaser.Geom.Circle.Contains,
            );
          }
        }
        if (gameObject instanceof TriangleGameObject) {
          const shape = gameObject.getShape();
          this.phaserGameObjects.push(this.add.triangle(
            transformProps.position[0],
            transformProps.position[1],
            shape.x1,
            shape.y1,
            shape.x2,
            shape.y2,
            shape.x3,
            shape.y3,
          ));
          if (gameObject.getHitboxState().hitboxActive) {
            this.phaserGameObjects[gameObject.id].setInteractive(
              new Phaser.Geom.Triangle(
                shape.x1,
                shape.y1,
                shape.x2,
                shape.y2,
                shape.x3,
                shape.y3,
              ), Phaser.Geom.Triangle.Contains,
            );
          }
        }
      }

      const phaserGameObject = this.phaserGameObjects[gameObject.id];
      // Handle pointer over GameObjects
      phaserGameObject.on('pointerover', () => {
        pointerOverGameObjectsId.add(gameObject.id);
      });
      phaserGameObject.on('pointerout', () => {
        pointerOverGameObjectsId.delete(gameObject.id);
      });

      // Enter debug mode
      if (DEBUG) {
        this.input.enableDebug(phaserGameObject);
      }

      // Store the phaserGameObject in the source representation
      gameObject.setPhaserGameObject(phaserGameObject);
    });

    // Create audio clips
    try {
      this.sourceAudioClips.forEach((audioClip: AudioClip) => {
        this.phaserAudioClips.push(this.sound.add(audioClip.getUrl(), {
          loop: audioClip.getLoop(),
          volume: audioClip.getVolume(),
        }));
      });
    } catch {
      this.runtimeError = true;
      debugLogArray.push('Runtime Error: Cannot load audio file');
    }

    // Handle keyboard inputs
    // Keyboard events can be detected inside the Source editor, which is not intended. #BUG
    this.input.keyboard.on('keydown', (event: KeyboardEvent) => {
      inputKeysDown.add(event.key);
    });
    this.input.keyboard.on('keyup', (event: KeyboardEvent) => {
      this.delayedKeyUpEvents.add(() => inputKeysDown.delete(event.key));
    });

    // Handle debug info
    if (!DEBUG) {
      debugLogArray.length = 0;
    }
    this.debugLogText = this.add.text(0, 0, debugLogArray)
      .setBackgroundColor('black')
      .setAlpha(0.8);
  }

  update(time, delta) {
    // Set the time and delta
    gameTime[0] += delta;
    loopCount[0]++;
    // gameDelta = delta;

    // Set the pointer
    pointerPosition = [Math.trunc(this.input.activePointer.x), Math.trunc(this.input.activePointer.y)];
    pointerPrimaryDown = this.input.activePointer.primaryDown;
    pointerSecondaryDown = this.input.activePointer.rightButtonDown();

    // Run the user-defined update function, and prevent runtime errors.
    try {
      if (!this.runtimeError) {
        userUpdateFunction(userGameStateArray);
      }
    } catch (error) {
      debugLogArray.push('Runtime Error: Error in user update function');
      this.runtimeError = true;
      console.log(error);
    }
    // Loop through each GameObject in the array and determine which needs to update.
    this.sourceGameObjects.forEach((gameObject: InteractableGameObject) => {
      const phaserGameObject = this.phaserGameObjects[gameObject.id] as PhaserGameObject;
      if (phaserGameObject) {
        // Update the transform of Phaser GameObject
        if (gameObject.hasTransformUpdates() || this.rerenderGameObjects) {
          const transformProps = gameObject.getTransform() as TransformProps;
          phaserGameObject.setPosition(transformProps.position[0], transformProps.position[1])
            .setRotation(transformProps.rotation)
            .setScale(transformProps.scale[0], transformProps.scale[1]);
          if (gameObject instanceof TriangleGameObject) {
            // The only shape that requires flipping is the triangle, as the rest are symmetric about their origin.
            phaserGameObject.setRotation(transformProps.rotation + (gameObject.getFlipState()[1] ? Math.PI : 0));
          }
          gameObject.updatedTransform();
        }

        // Update the image of Phaser GameObject
        if (gameObject.hasRenderUpdates() || this.rerenderGameObjects) {
          const color = gameObject.getColor();
          // eslint-disable-next-line new-cap
          const intColor = Phaser.Display.Color.GetColor32(color[0], color[1], color[2], color[3]);
          const flip = gameObject.getFlipState();
          if (gameObject instanceof TextGameObject) {
            (phaserGameObject as Phaser.GameObjects.Text).setTint(intColor)
              .setAlpha(color[3] / 255)
              .setFlip(flip[0], flip[1])
              .setText(gameObject.getText().text);
          } else if (gameObject instanceof SpriteGameObject) {
            (phaserGameObject as Phaser.GameObjects.Sprite).setTint(intColor)
              .setAlpha(color[3] / 255)
              .setFlip(flip[0], flip[1]);
          } else if (gameObject instanceof ShapeGameObject) {
            (phaserGameObject as Phaser.GameObjects.Shape).setFillStyle(intColor, color[3] / 255)
            // Phaser.GameObjects.Shape does not have setFlip, so flipping is done with rotations.
            // The only shape that requires flipping is the triangle, as the rest are symmetric about their origin.
              .setRotation(gameObject.getTransform().rotation + (flip[1] ? Math.PI : 0));
          }
          // Update the z-index (rendering order), to the top.
          if (gameObject.getShouldBringToTop()) {
            this.children.bringToTop(phaserGameObject);
          }
          gameObject.updatedRender();
        }
      } else {
        this.runtimeError = true;
        debugLogArray.push('Runtime Error: Cannot create GameObject in update_loop');
      }
    });

    // Handle audio updates
    this.sourceAudioClips.forEach((audioClip: AudioClip) => {
      if (audioClip.hasAudioClipUpdates()) {
        const phaserAudioClip = this.phaserAudioClips[audioClip.id] as Phaser.Sound.BaseSound;
        if (phaserAudioClip) {
          if (audioClip.shouldPlayClip()) {
            phaserAudioClip.play();
          } else {
            phaserAudioClip.stop();
          }
        } else {
          this.runtimeError = true;
          debugLogArray.push('Runtime Error: Cannot create Audio in update_loop');
        }
      }
    });

    // Delay KeyUp events, so that low FPS can still detect KeyDown.
    // eslint-disable-next-line array-callback-return
    this.delayedKeyUpEvents.forEach((event: Function) => event());
    this.delayedKeyUpEvents.clear();

    // Remove rerendering once game has been reloaded.
    this.rerenderGameObjects = false;

    // Set and clear debug info
    if (this.debugLogText) {
      this.debugLogText.setText(debugLogArray);
      this.children.bringToTop(this.debugLogText);
      if (this.runtimeError) {
        this.debugLogText.setColor('orange');
        this.sound.stopAll();
        this.scene.pause();
      } else {
        debugLogArray.length = 0;
      }
    }
  }
}
