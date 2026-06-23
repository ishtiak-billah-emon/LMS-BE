const AsyncHandler = (requsetHandler) => {

    return (req, res, next) => {
      Promise.resolve(requsetHandler(req, res, next)).catch((err)=>next(err))
    }
  }
  
  
  export { AsyncHandler };