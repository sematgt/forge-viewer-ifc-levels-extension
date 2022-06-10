import axios from 'axios'


async function getForgeToken (clientId, clientSecret) {
  try {
    const params = new URLSearchParams()

    Object.entries({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
      scope: 'code:all data:write data:read bucket:create bucket:delete bucket:read',
    }).forEach(([ key, value ]) => {
      params.append(key, value)
    })

    const response = await axios.post('https://developer.api.autodesk.com/authentication/v1/authenticate',
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })

    const { access_token, expires_in } = response.data
    return { token: access_token, timeInSeconds: expires_in }
  } catch (error) {
    throw (new Error(`Error while getting token - ${ error }`))
  }
}

export default getForgeToken