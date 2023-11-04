import React, { useEffect, useState } from 'react'
import './App.css'
import { BrowserRouter } from 'react-router-dom'

import RenderRouter from './routers'
import { authenticate } from './store/actions/auth_service/userActions'

function App() {

  const [ accessToken, setAccessToken ] = useState(null);

  // useEffect(() => { 
  //   const checkGaiaConnected = async () => {
  //     const data = await authenticate();
  //     if (data) {
  //       setAccessToken(data);
  //     }
  //   }
  //   checkGaiaConnected();
  // }, []);

  return (
    <>
    {/* {accessToken ? (
      <main className='flex'>
        <BrowserRouter basename='/client-gui'>
          <RenderRouter />
        </BrowserRouter>
      </main> 
    ) : (
      <main className='flex'>
        <p> GAIA is not connected.</p>
      </main>
    )  
    } */}
    <main className='flex'>
      <BrowserRouter basename='/client-gui'>
        <RenderRouter />
      </BrowserRouter>
    </main>
    </>
  )
}

export default App;
