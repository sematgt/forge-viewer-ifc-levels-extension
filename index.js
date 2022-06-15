import getForgeToken from './utils'
import LevelsPanel from './panel'


let viewer
const options = {
  env: 'AutodeskProduction',
  api: 'derivativeV2_EU',  // for models uploaded to EMEA change this option to 'streamingV2_EU'
  getAccessToken: async (onTokenReady) => {
    const { token, timeInSeconds } = await getForgeToken(process.env.CLIENT_ID, process.env.CLIENT_SECRET)
    onTokenReady(token, timeInSeconds)
  }
}

Autodesk.Viewing.Initializer(options, function () {

  const htmlDiv = document.getElementById('forgeViewer')
  viewer = new Autodesk.Viewing.GuiViewer3D(htmlDiv, {
    ghosting: false, lineRendering: false,
  })
  var startedCode = viewer.start()
  if (startedCode > 0) {
    console.error('Failed to create a Viewer: WebGL not supported.')
    return
  }
  console.log('Initialization complete, loading a model next...')
  viewer.setGhosting(false)

  var documentId = process.env.DOCUMENT_ID
  Autodesk.Viewing.Document.load(documentId, onDocumentLoadSuccess, onDocumentLoadFailure)
  
  async function onDocumentLoadSuccess(viewerDocument) {
    var defaultModel = viewerDocument.getRoot().getDefaultGeometry()
    const model = await viewer.loadDocumentNode(viewerDocument, defaultModel)
    NOP_VIEWER.loadedModel = model
    const panel = new LevelsPanel(
      document.querySelector('.adsk-viewing-viewer'),
      0,
      'Уровни',
      50,
      50
    )
    // panel.setVisible(false)
    await panel.initStoreysList()
  }
  
  function onDocumentLoadFailure() {
    console.error('Failed fetching Forge manifest')
  }
})
