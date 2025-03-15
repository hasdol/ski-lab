import React from 'react'
import { Helmet } from 'react-helmet-async'

const NotFoundPage = () => {
  return (
    <>
      <Helmet>
        <title>Ski-Lab: Not found</title>
        <meta name="description" content="Site not found" />


      </Helmet>
      <div className='p-4'>Error: page not found</div>

    </>
  )
}

export default NotFoundPage