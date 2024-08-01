import Phaser from "phaser";
import PlayerController from "./PlayerController";
import ObstaclesController from "./ObstaclesController";
import EnemyController from "./EnemyController";

export default class Game extends Phaser.Scene
{
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys

    private captain?: Phaser.Physics.Matter.Sprite
    private playerController?: PlayerController
    private obstacles!: ObstaclesController
    private enemyController: EnemyController[] = []

    constructor()
    {
        super('game')
    }

    init()
    {
        this.cursors = this.input.keyboard.createCursorKeys()
        this.obstacles = new ObstaclesController()
        this.enemyController = []

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.destroy()
        })
    }

    preload()
    {
        this.load.atlas('Captain', 'assets/Captain.png', 'assets/Captain.json')
        this.load.atlas('Enemy', 'assets/Enemy.png', 'assets/Enemy.json')

        this.load.image('tiles', 'assets/Terrain (32x32).png')
        this.load.image('spikes', 'Palm Tree Island/Sprites/Objects/Spikes/Spikes.png')
        this.load.tilemapTiledJSON('tilemap', 'assets/game.json')

        this.load.image('coin', 'Pirate Treasure/Sprites/Gold Coin/01.png')
        this.load.image('health', 'Pirate Treasure/Sprites/Red Potion/02.png')

        // Load background image
        this.load.image('background', 'Palm Tree Island/Sprites/Background/BG Image.png')

        //imagens da animaçao do capitao morto
        this.load.image('captain-dead-1', 'Captain Clown Nose/Sprites/Captain Clown Nose/Captain Clown Nose without Sword/08-Dead Ground/Dead Ground 01.png')
        this.load.image('captain-dead-2', 'Captain Clown Nose/Sprites/Captain Clown Nose/Captain Clown Nose without Sword/08-Dead Ground/Dead Ground 02.png')
        this.load.image('captain-dead-3', 'Captain Clown Nose/Sprites/Captain Clown Nose/Captain Clown Nose without Sword/08-Dead Ground/Dead Ground 03.png')
        this.load.image('captain-dead-4', 'Captain Clown Nose/Sprites/Captain Clown Nose/Captain Clown Nose without Sword/08-Dead Ground/Dead Ground 04.png')
    }

    create()
    {
        this.matter.world.drawDebug = false;
        
        const { width, height } = this.scale;

        const background = this.add.image(0, 0, 'background')
            .setOrigin(0, 0)
            .setDisplaySize(width, height);
        
        background.setScrollFactor(0);


        this.scene.launch('ui')

        const map = this.make.tilemap({key: 'tilemap'})
        const tileset = map.addTilesetImage('Terrain', 'tiles') //nome dentro do tiled, nome dado em cima
        const spikes = map.addTilesetImage('Spikes', 'spikes')

        const terrain = map.createLayer('Terrain', tileset)
        terrain.setCollisionByProperty({ collides: true })
        
        map.createLayer('obstacles', spikes)
    
        const objectsLayer = map.getObjectLayer('objects')

        objectsLayer.objects.forEach(object => {
            const{ x = 0, y = 0, name, width = 0, height = 0 } = object

            switch(name)
            {
                case 'Spawn':
                {
                    this.captain = this.matter.add.sprite(x!, y!, 'Captain')
                    
                    this.captain.setBody({
                        type: 'rectangle',
                        width: 22,
                        height: 25,
                    })

                    this.captain.setFixedRotation()

                    this.playerController = new PlayerController(this, this.captain, this.cursors, this.obstacles)

                    this.cameras.main.startFollow(this.captain, true, 0.1, 0.1, 0, 70)
                    break
                }
                case 'enemy':
                {
                    const enemy = this.matter.add.sprite(x, y, 'Enemy')
                        .setFixedRotation()

                    this.enemyController.push(new EnemyController(enemy))
                    this.obstacles.add('enemy', enemy.body as MatterJS.BodyType)
                    break
                }
                
                case 'coin':
                {
                    const star = this.matter.add.sprite(x, y, 'coin', undefined, {
                        isStatic: true,
                        isSensor: true
                    })

                    star.setData('type', 'coin')
                    break
                }
                case 'health':
                {
                    const health = this.matter.add.sprite(x, y, 'health', undefined, {
                        isStatic: true,
                        isSensor: true
                    })

                    health.setData('type', 'health')
                    health.setData('healthPoints', 2)
                    break
                }
                case 'spikes':
                {
                    const spike = this.matter.add.rectangle(x + (width*0.5), y + (height * 0.5), width, height, {
                        isStatic: true,
                    })
                    this.obstacles.add('spikes', spike)
                    break
                }
            }
        })

        this.matter.world.convertTilemapLayer(terrain)
    }

    destroy()
    {
        this.scene.stop('ui')
        this.enemyController.forEach(enemy => {
            enemy.destroy()
        })
    }

    update(t: number, dt: number)
    {
        if(this.playerController)
        {
            this.playerController.update(dt)
        }

        this.enemyController.forEach(enemy => {
            enemy.update(dt)
        })
    }
}