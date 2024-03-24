import './App.css'
import { useQuery, useMutation, useQueryClient, Query } from '@tanstack/react-query'
import { FormInput, FormTextArea } from './components/Form'
import { getComments, CommentWithId, postComment } from './service/comments'
import { Results } from './components/Results'
import React from 'react'

/* eslint-disable @typescript-eslint/explicit-function-return-type */
function App () {
  const { data, isLoading, error } = useQuery<CommentWithId>({
    queryKey: ['comments'],
    queryFn: getComments
  })

  const queryClient = useQueryClient()

  const { mutate, isPending: isLoadingMutation } = useMutation({
    mutationFn: postComment,
    onSuccess: async (newComment) => {
      // 1. Update the cached data manually. avoid refetching data
      // await queryClient.setQueryData(['comments'], (oldData?: CommentWithId[]) => {
      //   if (oldData == null) return [newComment]
      //   return [...oldData, newComment]
      // })

      // 2. Invalidate the cached data and refetch again
      // await queryClient.invalidateQueries({
      //   queryKey: ['comments']
      // })

    },
    onMutate: async (newComment) => {
      // 3. Optimistic update
      await queryClient.cancelQueries({
        queryKey: ['commnets']
      })

      // To rollback to previous state
      const previousComments = queryClient.getQueryData(['comments'])

      queryClient.setQueryData(['comments'], (oldData?: CommentWithId[]) => {
        if (oldData == null) return [newComment]
        return [...oldData, newComment]
      })

      return { previousComments }
    },
    onError: (error, context) => {
      console.log(error)
      if (context?.previousComments != null) {
        queryClient.setQueryData(['commnets'], context.previousComments)
      }
    },
    onSettled: async () => {
      // after to onMutate or onError and after to apply optimistic update or revert, we invalidate to data to refetch automatially
      await queryClient.invalidateQueries({
        queryKey: ['commnets']
      })
    }
  })

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (isLoadingMutation) return

    event?.preventDefault()
    const data = new FormData(event.currentTarget)
    const message = data.get('message')?.toString() ?? ''
    const title = data.get('title')?.toString() ?? ''

    if (title !== '' && message !== '') {
      mutate({ title, message })
    }
  }

  return (
    <main className='grid h-screen grid-cols-2'>
      <div className='col-span-1 p-8 bg-white'>

        {isLoading && <strong>Cargando...</strong>}
        {error != null && <strong>Algo ha ido mal</strong>}
        <Results data={data} />

      </div>
      <div className='col-span-1 p-8 bg-black'>
        <form className={`${isLoadingMutation ? 'opacity-40' : ''} block max-w-xl px-4 m-auto`} onSubmit={handleSubmit}>

          <FormInput />
          <FormTextArea />

          <button
            disabled={isLoadingMutation}
            type='submit' className='mt-4 px-12 text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-sm py-2.5 text-center mr-2 mb-2'
          >
            {isLoadingMutation ? 'Enviando comentario...' : 'Enviar comentario'}
          </button>
        </form>
      </div>
    </main>
  )
}

export default App
