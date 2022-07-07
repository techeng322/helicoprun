import { Scene } from 'phaser'

const gameState = {
  graphics: Phaser.GameObjects.Graphics,
  curve: Phaser.Curves.CubicBezier,
  curvesGroup: Phaser.Physics.Arcade.StaticGroup,
}

const SCREEN_WIDTH = window.innerWidth
const SCREEN_HEIGHT = window.innerHeight
const LINE_WIDTH = window.innerWidth / 4

const ONE_THIRD_OF_SCREEN_HEIGHT = window.innerHeight / 3
const widthFourthPart = window.innerWidth / 4

const MAXIMUM_ROAD_TOP_Y = Math.round(
  ONE_THIRD_OF_SCREEN_HEIGHT - ONE_THIRD_OF_SCREEN_HEIGHT / 2
)

const MINIMUM_ROAD_TOP_Y = Math.round(ONE_THIRD_OF_SCREEN_HEIGHT - ONE_THIRD_OF_SCREEN_HEIGHT / 4)

const ROAD_HEIGHT = Math.round(
  ONE_THIRD_OF_SCREEN_HEIGHT + ONE_THIRD_OF_SCREEN_HEIGHT / 2
)

const HELICOPTER_HEIGHT = ROAD_HEIGHT / 10

export class Game extends Scene {
  helicopter?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
  groupOfCurves?: Phaser.Physics.Arcade.StaticGroup
  boxes?: Phaser.Physics.Arcade.StaticGroup
  topLines?: Phaser.Curves.Path
  bottomLines?: Phaser.Curves.Path
  // boxes?: Phaser.GameObjects.Rectangle[]
  moveSpeed: number
  /** used to track how many pixel landscape is moved */
  moveOffset: number
  drawer?: Phaser.GameObjects.Graphics
  /** previous position that box rendered */
  prevBoxOffset?: number
  initialLoad: boolean

  constructor() {
    super({ key: 'Game' })
    this.moveOffset = 0
    this.moveSpeed = 6
    this.initialLoad = false
  }
  preload() {
    this.load.spritesheet('helicopter', 'src/assets/chopper.png', {
      frameWidth: 154,
      frameHeight: 91,
    })
    // this.load.spritesheet('helicopter', 'src/assets/helicopter.png', {
    //   frameWidth: 96,
    //   frameHeight: 32,
    // })
  }

  create() {
    this.physics.world.setBounds(
      0,
      0,
      window.innerWidth * 2,
      window.innerHeight
    )

    this.add
      .rectangle(0, 0, window.innerWidth, window.innerHeight, 0xffffff)
      .setOrigin(0)
    this.helicopter = this.physics.add.sprite(
      widthFourthPart / 2,
      ONE_THIRD_OF_SCREEN_HEIGHT + ONE_THIRD_OF_SCREEN_HEIGHT / 2,
      'helicopter'
    )

    this.helicopter.displayHeight = HELICOPTER_HEIGHT
    this.helicopter.scaleX = this.helicopter.scaleY


    this.helicopter.setTint(0x2b0101)

    this.boxes = this.physics.add.staticGroup()

    this.helicopter.setInteractive()
    this.anims.create({
      key: 'move',
      frames: this.anims.generateFrameNumbers('helicopter', {}),
      frameRate: 200,
      repeat: -1,
    })
    this.helicopter.anims.startAnimation('move')
    this.helicopter.body.allowGravity = false
    this.helicopter.refreshBody()

    // Graphics part
    this.drawer = this.add.graphics()
    // gameState.curvesGroup = this.physics.add.staticGroup()
    this.topLines = new Phaser.Curves.Path(0, MAXIMUM_ROAD_TOP_Y)
    this.bottomLines = new Phaser.Curves.Path(
      0,
      MAXIMUM_ROAD_TOP_Y + ROAD_HEIGHT
    )

    // generate initial lines
    // consider one more line as buffer
    for (let x = LINE_WIDTH; x <= SCREEN_WIDTH + LINE_WIDTH; x += LINE_WIDTH) {
      const topLineY = Phaser.Math.Between(
        MAXIMUM_ROAD_TOP_Y,
        MINIMUM_ROAD_TOP_Y
      )
      const BottomLineY = topLineY + ROAD_HEIGHT

      this.topLines.lineTo(x, topLineY)
      this.bottomLines.lineTo(x, BottomLineY)

      // x > 2 will make it to not draw any box on first steps of game
      if (x > 2 && Phaser.Math.Between(0, 3) === 1) {
        this.drawRectangle(x, topLineY)
      }
    }

    this.physics.add.collider(this.boxes, this.helicopter, () => {
      this.cameras.main.shake(250, 0.005)
    })

    this.moveOffset = 0
  }

  drawRectangle(xOffset: number, yOffset: number) {
    const oneFiftOfRoadHeight = ROAD_HEIGHT / 5
    const rectangleHeight = oneFiftOfRoadHeight * 2
    const rectangleWidth = LINE_WIDTH / 8

    const positions = [
      // top
      Math.round(yOffset),
      // // bottom
      Math.round(yOffset + ROAD_HEIGHT - rectangleHeight),
      // // middle top
      Math.round(yOffset + oneFiftOfRoadHeight),
      // // middle bottom
      Math.round(yOffset + oneFiftOfRoadHeight * 2),
    ]

    if(this.prevBoxOffset !== undefined) {
      positions.splice(this.prevBoxOffset, 1)
    }

    // pick a random position
    const randomYOffset = positions[ Math.floor( Math.random() * positions.length ) ]
    
    this.prevBoxOffset = positions.indexOf(randomYOffset)

    const rectangle = this.add
      .rectangle(
        xOffset + LINE_WIDTH,
        randomYOffset,
        rectangleWidth,
        rectangleHeight,
        0x2b0101
      )
      .setOrigin(0, 0)
    this.boxes?.add(rectangle)
  }

  update(): void {
    if (!this.helicopter) {
      throw new Error('helicopter game object not exists!')
    }
    if (!this.drawer) {
      throw new Error('drawer not exists!')
    }

    if (!this.topLines?.getLength() || !this.bottomLines?.getLength()) {
      throw new Error('top and bottom lines should not be empty')
    }

    this.cameras.main.scrollX += this.moveSpeed
    this.helicopter.x += this.moveSpeed
    this.moveOffset += this.moveSpeed


    if (this.input.activePointer.isDown) {
      this.initialLoad = true
      // this.helicopter.y -= 2
      this.helicopter.angle = 5
      this.helicopter.setAccelerationY(-900)
    } else if (this.initialLoad) {
      // this.helicopter.y += 2
      this.helicopter.angle = 0
      this.helicopter.setAccelerationY(900)
    }

    this.helicopter.setMaxVelocity(300)

    if (this.moveOffset >= LINE_WIDTH) {
      const topLineY = Phaser.Math.Between(
        MAXIMUM_ROAD_TOP_Y,
        MINIMUM_ROAD_TOP_Y
      )

      const bottomLineY = topLineY + ROAD_HEIGHT


      const endPointX = this.topLines.getEndPoint().x

      // if (endPointX > 2 && Phaser.Math.Between(0, 1) === 1) {
      this.drawRectangle(endPointX, topLineY)
      // }

      this.topLines.lineTo(this.topLines.getEndPoint().x + LINE_WIDTH, topLineY)
      this.bottomLines.lineTo(
        this.bottomLines.getEndPoint().x + LINE_WIDTH,
        bottomLineY
      )
      this.topLines.curves.shift()
      this.bottomLines.curves.shift()
      this.moveOffset = 0
    }

    // clear previous command to avoid necessary redraw
    this.drawer.clear()

    this.drawLandChunk(this.topLines.curves, 'top')

    this.drawLandChunk(this.bottomLines.curves, 'bottom')
  }

  drawLandChunk(curves: Phaser.Curves.Curve[], position: 'top' | 'bottom') {
    const yValue: number = position === 'top' ? 0 : SCREEN_HEIGHT

    const points: { x: number; y: number }[] = [
      {
        x: 0,
        y: yValue,
      },
    ]

    let lastX = 0

    for (let i = 0; i < curves.length; i++) {
      const eachCurve = curves[i]
      points.push(eachCurve.getStartPoint(), eachCurve.getEndPoint())
      lastX = eachCurve.getEndPoint().x
    }

    points.push({ x: lastX, y: yValue })

    this.drawer!.fillStyle(0x2b0101)
    this.drawer!.fillPoints(points, true, true)
  }
}
