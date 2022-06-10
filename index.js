import getForgeToken from './utils'


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
  viewer = new Autodesk.Viewing.GuiViewer3D(htmlDiv)
  var startedCode = viewer.start()
  if (startedCode > 0) {
    console.error('Failed to create a Viewer: WebGL not supported.')
    return
  }
  console.log('Initialization complete, loading a model next...')
  var documentId = process.env.DOCUMENT_ID
  Autodesk.Viewing.Document.load(documentId, onDocumentLoadSuccess, onDocumentLoadFailure)
  
  function onDocumentLoadSuccess(viewerDocument) {
    var defaultModel = viewerDocument.getRoot().getDefaultGeometry()
    viewer.loadDocumentNode(viewerDocument, defaultModel)
  }
  
  function onDocumentLoadFailure() {
    console.error('Failed fetching Forge manifest')
  }
})
