import React from 'react';
import Phaser from 'phaser';
import { type DebuggerContext } from '../../typings/type_helpers';

/**
 * Game display tab for user-created games made with the Arcade2D module.
 *
 * @module arcade_two_d
 * @author Titus Chew Xuan Jun
 * @author Xenos Fiorenzo Anong
 */

/**
 * React Component props for the Tab.
 */
type Props = {
  children?: never;
  className?: never;
  context?: any;
};

/**
 * React Component state for the Tab.
 */
type State = {
  counter: number;
  time: number;
  game?: Phaser.Game;
};

/**
 * The main React Component of the Tab.
 */
class GameCanvas extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    this.state = {
      counter: 0,
      time: Date.now(),
      game: undefined,
    };
  }

  componentDidMount() {
    console.log('componentDidMount');
    // only mount the component when the Arcade2D tab is active
    if (document.querySelector('[id="bp4-tab-panel_side-content-tabs_Arcade2D Tab"]')?.ariaHidden === 'true') {
      console.log('Arcade2D tab not active');
      return;
    }
    // Check if there is already a canvas, then do nothing.
    if (this.props.context.result?.value?.loadedGame) {
      console.log('Run the Source program to reload the game.');
      return;
    // console.log(this.props.context.result?.value?.phaserGameInstance);
    //   console.log(this.props.context.result?.value?.phaserGameInstance?.canvas);
    //   console.log(this.props.context.result?.value?.offscreenCanvas);
    //   // need to store an instance of the canvas here to rebuild
    //   const canvas = (document.querySelector('#phaser-game canvas') as HTMLCanvasElement)?.getContext('bitmaprenderer') as ImageBitmapRenderingContext;
    //   const bitmap = this.props.context.result?.value?.offscreenCanvas?.transferToImageBitmap();
    //   if (canvas) {
    //     canvas.transferFromImageBitmap(bitmap);
    //     console.log('image transfered 3 ');
    //     console.log(bitmap);
    }

    // if (canvas) {
    //   const ctx = canvas.getContext('webgl');
    //   const image = this.props.context.result.value.phaserGameInstance.canvas;
    //   if (ctx) {
    //     ctx.drawImage(image, 33, 71, 104, 124, 21, 20, 87, 104);
    //   }
    // }
    // Use an offscreen canvas

    // const canvas = this.props.context.result?.value?.phaserGameInstance?.canvas;
    // return;
    // }

    // Config will exist since it is checked in toSpawn
    const config = this.props.context.result?.value?.gameConfig;
    // Modify the canvas in Phaser config to use existing canvas.
    // config.canvas = document.querySelector('#phaser-game canvas');
    this.setState({
      game: new Phaser.Game(config),
    });
    // this.props.context.result.value.phaserGameInstance = this.state.game;
    // this.props.context.result.value.offscreenCanvas = config.canvas.transferControlToOffscreen();
    this.props.context.result.value.loadedGame = true;
    const canvas = document.getElementById('myCanvas');
    if (canvas) {
      canvas.oncontextmenu = () => false;
    }
  }

  shouldComponentUpdate() {
    // Component itself is a wrapper & should not update - Phaser handles the game updates
    return false;
  }

  componentWillUnmount(): void {
    console.log('componentWillUnmount');
    this.state.game?.sound.stopAll();
    // this.props.context.result.value.gameEnded = true;

    // Remove the current WEBGL context, to prevent multiple webgl contexts from causing problems.
    // Note that spamming run will still cause multiple webgl contexts, as they take time to be removed.
    // const canvas = document.querySelector('#phaser-game canvas') as HTMLCanvasElement;
    // const gl = canvas?.getContext('webgl');
    // const gl = this.state.game?.context;
    // if (gl instanceof WebGLRenderingContext) {
    //   gl?.getExtension('WEBGL_lose_context')
    //     ?.loseContext();
    // }
  }

  public render() {
    return (
      <div id="phaser-game"/>
    );
  }
}

export default {
  /**
   * This function will be called to determine if the component will be
   * rendered. Currently spawns when there is a stored game config, or if
   * the string in the REPL is "[Arcade2D]".
   * @param {DebuggerContext} context
   * @returns {boolean}
   */
  toSpawn(context: DebuggerContext) {
    // const config = context.context?.moduleContexts?.arcade_two_d?.state?.gameConfig;
    const config = context.result?.value?.gameConfig;
    console.log(config);
    if (config) {
      return true;
    }
    return false;
  },

  /**
   * This function will be called to render the module tab in the side contents
   * on Source Academy frontend.
   * @param {DebuggerContext} context
   */
  body: (context: DebuggerContext) => <GameCanvas context={context} />,

  /**
   * The Tab's icon tooltip in the side contents on Source Academy frontend.
   */
  label: 'Arcade2D Tab',

  /**
   * BlueprintJS IconName element's name, used to render the icon which will be
   * displayed in the side contents panel.
   * @see https://blueprintjs.com/docs/#icons
   */
  iconName: 'shapes',
};
