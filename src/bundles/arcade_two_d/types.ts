/**
 * This file contains the types used to represent GameObjects
 */

/**
 * Represents transform properties of a GameObject in worldspace.
 * @property {[number, number]} position - The (x,y) worldspace position of the GameObject.
 * @property {[number, number]} xScale - The (x,y) worldspace scale of the GameObject.
 * @property {number} rotation - The worldspace rotation of the GameObject, in radians counter-clockwise.
 */
export type TransformProps = {
  position: [number, number];
  scale: [number, number];
  rotation: number;
};

/**
 * Represents the render properties of a GameObject.
 * @property {Color} color - The color associated with the GameObject tint.
 * @property {[number, number]} flip - The (x,y) flip state of the GameObject.
 * @property {boolean} visible - The render-visibility of the GameObject.
 * @property {RenderedImage} renderedImage - The property that is rendered in the canvas.
 */
export type RenderProps = {
  color: Color;
  flip: [boolean, boolean];
  visible: boolean;
  renderedImage: RenderedImage;
};

/**
 * Represents the interactable properties of a GameObject.
 * @property {boolean} hitboxActive - The interactable state of the hitbox associated with the GameObject in the canvas.
 */
export type InteractableProps = {
  hitboxActive: boolean;
};

/**
 * Represents the RGBA color properties of a GameObject.
 */
export type Color = {
  red: number,
  green: number,
  blue: number,
  alpha: number,
};

/**
 * Represents the rendered image of a GameObject.
 */
export type RenderedImage = Shape | DisplayText | Sprite;

/**
 * Represents a simplied representation of the phaser type of the GameObject.
 * Which is represented as a void property on the types.
 */
export type PhaserType = 'Shape' | 'Sprite' | 'Text';

/**
 * Represents the shape of a GameObject
 */
export type Shape = {
  Shape: void;
  baseShape: BaseShape;
};

/**
 * Represents the base shape of a GameObject
 */
export type BaseShape = Points | Polygon | Ellipse;

/**
 * Represents a GameObject's shape by its points.
 */
export type Points = {
  points: [number, number][];
};

/**
 * Represents the a regular polygon of a GameObject's shape.
 */
export type Polygon = {
  numberOfSides: number;
};

/**
 * Represents a circular shape of a GameObject's shape.
 */
export type Ellipse = {
  radius: number;
};

/**
 * Represents the rendered text of a GameObject.
 */
export type DisplayText = {
  Text: void;
  text: string;
};

/**
 * Represents the rendered sprite of a GameObject.
 */
export type Sprite = {
  Sprite: void;
  image_url: string;
};

// =============================================================================
// Other types
// =============================================================================

/**
 * Represent the return type of build_game(), which is accessed in the debuggerContext.result.value.
 */
export type BuildGame = {
  toReplString: () => string;
  // config: Config;
  // init: () => void;
  // update: UpdateFunction;
};

/**
 * Represents the configuration for the Phaser Game.
 * @property {number} width - The width of the Phaser canvas.
 * @property {number} height - The height of the Phaser canvas.
 * @property {number} scale - The scale of the Phaser canvas.
 * @property {number} volume - The volume of the Phaser canvas.
 * @property {number} fps - The width of the Phaser canvas.
 */
export type Config = {
  width: number,
  height: number,
  scale: number,
  volume: number,
  fps: number,
};

/**
 * Represents an update function that is user-defined.
 * userSuppliedState is an array that stores whatever the user sets it to be,
 * which can be assessed and modified on the next frame.
 */
export type UpdateFunction = (userSuppliedState: []) => void;