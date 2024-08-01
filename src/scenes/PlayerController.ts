import Phaser from 'phaser'
import StateMachine from '~/statemachine/StateMachine'
import { sharedInstance as events} from './EventCenter'
import ObstaclesController from './ObstaclesController'

export default class PlayerController{
    private sprite: Phaser.Physics.Matter.Sprite
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys
    private obstacles: ObstaclesController
    private scene: Phaser.Scene

    private stateMachine: StateMachine
    private health = 10
    private coinsCollected = 0

    private lastEnemy?: Phaser.Physics.Matter.Sprite

    constructor(scene: Phaser.Scene, sprite: Phaser.Physics.Matter.Sprite, cursors : Phaser.Types.Input.Keyboard.CursorKeys, obstacles: ObstaclesController)
    {
        this.scene = scene
        this.sprite = sprite
        this.cursors = cursors
        this.obstacles = obstacles
        

        this.createAnimations()

        this.stateMachine = new StateMachine(this, 'player')

        this.stateMachine.addState('idle', {
            onEnter: this.idleOnEnter,
            onUpdate: this.idleOnUpdate
        })
        .addState('walk', {
            onEnter: this.walkOnEnter,
            onUpdate: this.walkOnUpdate
        })
        .addState('jump', {
            onEnter: this.jumpOnEnter,
            onUpdate: this.jumpOnUpdate
        })
        .addState('spike-hit', {
            onEnter: this.spikeHitOnEnter,
            onUpdate: this.spikeHitOnUpdate
        })
        .addState('enemy-hit',{
            onEnter: this.enemyHitOnEnter,
        })
        .addState('stomp-enemy', {
            onEnter: this.stompEnemyOnEnter
        })
        .addState('dead', {
            onEnter: this.deadOnEnter
        })
        .setState('idle')
        
        
        this.sprite.setOnCollide((data: MatterJS.ICollisionPair) => {
            const body = data.bodyB as MatterJS.BodyType

            if(this.obstacles.is('spikes', body))
            {
                this.stateMachine.setState('spike-hit')
                return 
            }

            if(this.obstacles.is('enemy', body))
            {
                this.lastEnemy = body.gameObject
                if(this.sprite.y < body.position.y)
                {
                    //cair em cima do enimigo
                    this.stateMachine.setState('stomp-enemy')
                }
                else
                {
                    //atingido pelo inimigo
                    this.stateMachine.setState('enemy-hit')
                }
                return
            }

            const gameObject = body.gameObject

            if(!gameObject)
            {
                return
            }

            if(gameObject instanceof Phaser.Physics.Matter.TileBody)
            {
                if(this.stateMachine.isCurrentState('jump'))
                {
                    this.stateMachine.setState('idle')
                }
                return
            }

            const sprite = gameObject as Phaser.Physics.Matter.Sprite
            const type = sprite.getData('type')


            switch(type)
            {
                case 'coin':
                {
                    this.coinsCollected++
                    events.emit('coin-collected', this.coinsCollected)
                    sprite.destroy()
                    if(this.coinsCollected === 20)
                    {
                        this.scene.time.delayedCall(1000, () => {
                            this.scene.scene.start('game-win')
                        })
                    }
                    break
                }
                case 'health':
                {
                    const value = sprite.getData('healthPoints') ?? 2
                    this.health = Phaser.Math.Clamp(this.health + value, 0, 10)
                    events.emit('health-changed', this.health)
                    sprite.destroy()
                    break
                }
            }
        })
    }

    update(dt: number)
    {
        this.stateMachine.update(dt)
    }

    private setHealth(value: number)
    {
        this.health = Phaser.Math.Clamp(value, 0, 10)
        events.emit('health-changed', this.health)

        //verificar morte
        if(this.health <= 0)
        {
            this.stateMachine.setState('dead')
        }
    }

    private idleOnEnter()
    {
        this.sprite.play('Captain-Idle')
    }

    private idleOnUpdate()
    {
        if(this.cursors.left.isDown || this.cursors.right.isDown)
        {
            this.stateMachine.setState('walk')
        }

        const spaceJustPressed = Phaser.Input.Keyboard.JustDown(this.cursors.space)
        if(spaceJustPressed)
        {
            this.stateMachine.setState('jump')
        }
    }

    private walkOnEnter()
    {
        this.sprite.play('Captain-Run')
    }

    private walkOnUpdate()
    {
        const speed = 3

        if(this.cursors.left.isDown)
        {
            this.sprite.flipX = true
            this.sprite.setVelocityX(-speed)
        }
        else if(this.cursors.right.isDown)
        {
            this.sprite.flipX = false
            this.sprite.setVelocityX(speed)
        }
        else
        {
            this.sprite.setVelocityX(0)
            this.stateMachine.setState('idle')
        }

        const spaceJustPressed = Phaser.Input.Keyboard.JustDown(this.cursors.space)
        if(spaceJustPressed)
        {
            this.stateMachine.setState('jump')
        }
    }

    private jumpOnEnter()
    {
        this.sprite.setVelocityY(-6)
    }

    private jumpOnUpdate()
    {
        const speed = 3

        if(this.cursors.left.isDown)
        {
            this.sprite.flipX = true
            this.sprite.setVelocityX(-speed)
        }
        else if(this.cursors.right.isDown)
        {
            this.sprite.flipX = false
            this.sprite.setVelocityX(speed)
        }
    }

    private spikeHitOnEnter()
    {
        this.sprite.setVelocityY(-7)

        this.setHealth(this.health - 1)

        this.sprite.play('Captain-Damaged')

        this.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
            this.stateMachine.setState('idle')
        })
    }

    private spikeHitOnUpdate(){
        const speed = 3

        if(this.cursors.left.isDown)
        {
            this.sprite.flipX = true
            this.sprite.setVelocityX(-speed)
        }
        else if(this.cursors.right.isDown)
        {
            this.sprite.flipX = false
            this.sprite.setVelocityX(speed)
        }
    }

    private enemyHitOnEnter()
    {
        if(this.lastEnemy)
        {
            if(this.sprite.x < this.lastEnemy.x)
            {
                this.sprite.setVelocityX(-5)
            }
            else
            {
                this.sprite.setVelocityX(5)
            }
        }
        else
        {
            this.sprite.setVelocityY(-7)
        }

        this.setHealth(this.health - 1)

        this.sprite.play('Captain-Damaged')

        this.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
            this.stateMachine.setState('idle')
        })
    }

    private stompEnemyOnEnter()
    {
        this.sprite.setVelocityY(-7)
        
        events.emit('enemy-stomped', this.lastEnemy)

        this.stateMachine.setState('idle')
    }

    private deadOnEnter()
    {
        this.sprite.play('Captain-Dead')

        this.sprite.setOnCollide(() => {})

        this.scene.time.delayedCall(1500, () => {
            this.scene.scene.start('game-over')
        })
    }

    private createAnimations()
    {
        this.sprite.anims.create({
            key: 'Captain-Idle',
            frameRate: 10,
            frames: this.sprite.anims.generateFrameNames('Captain', {
                start: 1, 
                end: 5, 
                prefix: '09-Idle Sword/Idle Sword 0', 
                suffix: '.png'
            }),
            repeat: -1
        })

        this.sprite.anims.create({
            key: 'Captain-Run',
            frameRate: 10,
            frames: this.sprite.anims.generateFrameNames('Captain', {
                start: 1, 
                end: 6, 
                prefix: '10-Run Sword/Run Sword 0', 
                suffix: '.png'
            }),
            repeat: -1
        })    

        this.sprite.anims.create({
            key: 'Captain-Damaged',
            frameRate: 10,
            frames: this.sprite.anims.generateFrameNames('Captain', {
                start: 1, 
                end: 4, 
                prefix: '14-Hit Sword/Hit Sword 0', 
                suffix: '.png'
            }),
            repeat: 1
        })

        this.sprite.anims.create({
            key: 'Captain-Dead',
            frameRate: 10,
            frames:
            [
                {key: 'captain-dead-1'},
                {key: 'captain-dead-2'},
                {key: 'captain-dead-3'},
                {key: 'captain-dead-4'}
            ],
            repeat: -1
        })
    }
}