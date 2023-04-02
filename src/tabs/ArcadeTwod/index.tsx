import React from 'react';
import Phaser from 'phaser';
import { type DebuggerContext } from '../../typings/type_helpers';
import { Button, ButtonGroup } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';

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
 * React Component state for the Game.
 */
type GameState = {
  counter: number;
  time: number;
  game?: Phaser.Game;
};

/**
 * React component state for the UI buttons.
 */
type UiState = {
  paused: boolean;
};

/**
 * React component props for the UI buttons.
 */
type UiProps = {
  children?: never;
  className?: never;
  context?: any;
  onClick: (b: boolean) => void;
};

/**
 * Component for UI buttons within tab e.g play/pause.
 */
class A2dUiButtons extends React.Component<UiProps, UiState> {
  constructor(props) {
    super(props);
    this.state = {
      paused: false,
    };
  }

  toggleGamePause(): void {
    if (this.state.paused) {
      this.props.onClick(false);
      this.setState({ paused: false });
    } else {
      this.props.onClick(true);
      this.setState({ paused: true });
    }
  }

  public render() {
    return (
      <ButtonGroup>
        <Button
          className="a2d-play-toggle-button"
          icon={this.state.paused ? IconNames.PLAY : IconNames.PAUSE}
          active={false}
          onClick={() => this.toggleGamePause()}
          text={this.state.paused ? 'Resume Game' : 'Pause Game'}
        />
      </ButtonGroup>
    );
  }
}

/**
 * The main React Component of the Tab.
 */
class GameTab extends React.Component<Props, GameState> {
  constructor(props) {
    super(props);
    this.state = {
      counter: 0,
      time: Date.now(),
      game: undefined,
    };
  }

  componentDidMount() {
    // console.log('componentDidMount');
    // Only mount the component when the Arcade2D tab is active
    if (document.querySelector('[id="bp4-tab-panel_side-content-tabs_Arcade2D Tab"]')?.ariaHidden === 'true') {
      // console.log('Arcade2D tab not active');
      return;
    }

    // Config will exist since it is checked in toSpawn
    const config = this.props.context.result?.value?.gameConfig;
    this.setState({
      game: new Phaser.Game(config),
    });
  }

  shouldComponentUpdate() {
    // Component itself is a wrapper & should not update - Phaser handles the game updates
    return false;
  }

  toggleGamePause(pause: boolean): void {
    if (pause) {
      // console.log('Game paused');
      // Default scene since there is only one scene.
      this.state.game?.scene.pause('default');
      this.state.game?.sound.pauseAll();
    } else {
      this.state.game?.scene.resume('default');
      this.state.game?.sound.resumeAll();
      // console.log('Game resumed');
    }
  }

  componentWillUnmount(): void {
    // console.log('componentWillUnmount');
    this.state.game?.sound.stopAll();

    // Prevents multiple update loops being run at the same time
    this.state.game?.destroy(false, false);
  }

  public render() {
    return (
      <div
        id="a2d-tab"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
      >
        <div id="phaser-game" />
        <A2dUiButtons onClick={(p) => this.toggleGamePause(p)} />
      </div>
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
    // console.log(config);
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
  body: (context: DebuggerContext) => <GameTab context={context} />,

  /**
   * The Tab's icon tooltip in the side contents on Source Academy frontend.
   */
  label: 'Arcade2D Tab',

  /**
   * BlueprintJS IconName element's name, used to render the icon which will be
   * displayed in the side contents panel.
   * @see https://blueprintjs.com/docs/#icons
   */
  iconName: IconNames.SHAPES,
};