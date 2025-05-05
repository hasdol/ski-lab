import Head from 'next/head'
import React from 'react'
const NotFoundPage = () => {
  return (
    <>
      <Head>
        <title>Ski-Lab: Not found</title>
        <meta name="description" content="Site not found" />


      </Head>
      <div className='p-4'>Error: page not found</div>

    </>
  )
}

export default NotFoundPage