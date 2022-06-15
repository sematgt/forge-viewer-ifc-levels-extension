const createLevelsIcon = () => {
  return [
      '<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">',
          '<g stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">',
          '<path d="M4 8 L12 3 L 20 8 L12 13Z"/>',
          '<path d="M4 12 L12 17 L 20 12"/>',
          '<path d="M4 16 L12 21 L 20 16"/>Ä',
          '</g>',
      '</svg>'
  ].join('')
}

const av = Autodesk.Viewing
const avu = av.UI

class StoreysList {
  constructor(model) {
    this.model = model
    this.node = document.createElement('ul')
    
    return this
  }

  async init() {
    this._storeysData = await new Promise((resolve) => this.model.getBulkProperties([], [ 'IfcClass', 'Name', 'externalId' ],
      (dbidsData) => resolve(dbidsData.filter((dbidData) => {
        const ifcClassProp = dbidData.properties.find((propData) => propData.displayName === 'IfcClass')

        return ifcClassProp ? ifcClassProp.displayValue === 'IfcBuildingStorey' : false
      }))))

      this._storeysData.forEach(({ dbId, externalId, properties }, index) => {
      const name = properties.find((prop) => prop.displayName === 'Name')
      const storeyNode = document.createElement('li')
      storeyNode.id = 'ifcStorey'
      storeyNode.style.marginTop = index ? '8px' : '0px'
      storeyNode.style.cursor = 'pointer'
      storeyNode.innerText = name.displayValue
      storeyNode.onclick = async () => {
        const storeyNodes = document.querySelectorAll('#ifcStorey')
        const isSelected = storeyNode.hasAttribute('selected')
        if (isSelected) {
          this.showAllElements(this.model)
          storeyNode.removeAttribute('selected')
          storeyNodes.forEach((node) => {
            node.style.fontWeight = 400
            node.style.opacity = 1
          })
        } else {
          NOP_VIEWER._loadingSpinner.show()
          await this.isolateStorey(`0/0/0/${parseInt(externalId[externalId.length - 1]) + 1}`)
          NOP_VIEWER._loadingSpinner.destroy()
          storeyNodes.forEach((storeyNode) => {
            storeyNode.style.fontWeight = 400
            storeyNode.style.opacity = 0.72
            storeyNode.removeAttribute('selected')
          })
          storeyNode.style.fontWeight = 600
          storeyNode.style.opacity = 1
          storeyNode.setAttribute('selected', '')
        }
      }
      this.node.append(storeyNode)
    })
  }

  hideAllElements(model) {
    let instanceTree = model.getData().instanceTree
    let rootId = instanceTree.getRootId()
    NOP_VIEWER.hide(rootId, model)
  }

  showAllElements(model) {
    let instanceTree = model.getData().instanceTree
    let rootId = instanceTree.getRootId()
    NOP_VIEWER.show(rootId, model)
  }

  isLocatesOnFloor(elementExternalId, floorExternalId) { // floorExternalId must be sliced
    // so that the last character is a floor number, e.g. '0/0/0/4' '0/0/0/4/1/0/0' - is wrong 
    const element = elementExternalId.split('/')
    const floor = floorExternalId.split('/')

    if (floor[ floor.length - 1 ] !== element[ floor.length - 1 ]) return false

    return true
  }

  async getAllElementsProperties(propertiesDisplayName, model) {
    return await new Promise((resolve) => model.getBulkProperties({}, propertiesDisplayName, resolve))
  }

  async getNotCeilingElements(model) {
    const allElementsData = await this.getAllElementsProperties([ 'IfcClass' ], model)

    return allElementsData.reduce((ids, item) => {
      const elementClass = item.properties.find((property) => property.displayName === 'IfcClass')?.displayValue
      const elementCategory = item.properties.find((property) => property.displayName === 'Category')?.displayValue

      if (elementClass !== 'IfcCovering' && elementClass !== 'IfcColumn' && elementClass !== 'IfcCurtainWall'
        && elementClass !== 'IfcPlate' && elementClass !== 'IfcBuildingElementProxy' && !(elementClass === 'IfcSlab')
      ) {
        ids.push(item.dbId)
      }
      return ids
    }, [])
  }

  async isolateStorey(storeyExternalId) {
    const externalIdMapping = await new Promise((resolve, reject) => this.model.getExternalIdMapping(resolve))

    const notCeilingIds = await this.getNotCeilingElements(this.model)

    let idsToShow = []
    for (let [ objectExternalId, objectId ] of Object.entries(externalIdMapping).filter(([ externalId, objectId ]) => notCeilingIds.includes(objectId))) {
      if (this.isLocatesOnFloor(objectExternalId, storeyExternalId)) {
        idsToShow.push(objectId)
      }
    }

    console.log({ idsToShow })
    // show elements of arch model

    this.hideAllElements(this.model)
    NOP_VIEWER.show(idsToShow, this.model)
  }
}

LevelsPanel = function (parentContainer, id, title, x, y) {
  const content = document.createElement('div')
  this.storeysList = new StoreysList(NOP_VIEWER.loadedModel)
  content.append(this.storeysList.node)
  this.content = content

  avu.DockingPanel.call(this, parentContainer, id, title, { addFooter: true })
  this.setVisible(false)
  // Auto-fit to the content and don't allow resize.  Position at the coordinates given.
  //
  this.container.style.display = "block"
  this.container.style.height = "600px"
  this.container.style.width = "400px"
  this.container.style.resize = "auto"
  this.container.style.left = x + "px"
  this.container.style.top = y + "px"
  this.container.style.backgroundСolor = "rgba(34,34,34,.9)"


  // add levels button
  const levelsButton = new avu.Button("toolbar-levelsTool")
  levelsButton.setToolTip('Levels')
  levelsButton.icon.innerHTML = createLevelsIcon()

  const toolbar = NOP_VIEWER.getToolbar()
  const modelTools = toolbar.getControl(av.TOOLBAR.MODELTOOLSID)
  if (modelTools && levelsButton) {
    modelTools.addControl(levelsButton)
  }

  levelsButton.onClick = () => {
    const visible = !this.isVisible()
    this.setVisible(visible)
  }

  this.addVisibilityListener((visible) => {
    levelsButton.setState(visible ? avu.Button.State.ACTIVE : avu.Button.State.INACTIVE)
  })
}

LevelsPanel.prototype = Object.create(avu.DockingPanel.prototype)
LevelsPanel.prototype.constructor = LevelsPanel

LevelsPanel.prototype.initialize = function () {
  this.title = this.createTitleBar(this.titleLabel)
  this.container.appendChild(this.title)
  this.initializeMoveHandlers(this.title)

  this.closer = this.createCloseButton()
  this.container.appendChild(this.closer)

  this.container.appendChild(this.content)

  if (this.options.addFooter) {
    this.footer = this.createFooter()
    this.container.appendChild(this.footer)
  }

  this.container.classList.add('docking-panel-container-solid-color-a')
}

LevelsPanel.prototype.initStoreysList = async function() {
  await this.storeysList.init()
}

export default LevelsPanel