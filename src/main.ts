import Phaser from 'phaser'

import Game from './scenes/game'
import UI from './scenes/UI'
import GameOver from './scenes/GameOver'
import GameWin from './scenes/GameWin'

const config: Phaser.Types.Core.GameConfig = {
	type: Phaser.AUTO,
	width: 360,
	height: 360,
	physics: {
		default: 'matter',
		matter: {
			debug: true
		}
	},
	scene: [Game, UI, GameOver, GameWin]
}

export default new Phaser.Game(config)
