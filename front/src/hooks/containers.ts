import { useState } from 'react';
import { deleteCont, getContainers, setContainerState } from "../client";
import { Container, ContainerStateSetter } from '../types';

interface ContainerHookData {
  containerList: Container[],
  updateFailed: boolean,
  containerUpdate: string[],
  error: string,
  refresh: () => void,
  changeContainerState: (id: string) => (state: ContainerStateSetter) => void,
  deleteContainer: (id: string) => void
}

export const useContainers = (token: string | null): ContainerHookData => {
  const [containerList, setContainerList] = useState<Container[]>([]);
  const [updateFailed, setUpdateFailed] = useState(false);
  const [containerUpdate, setContainerUpdate] = useState<string[]>([]);
  const [error, setError] = useState('');

  const refresh = () => {
    getContainers(token)
      .then(lst => {
        setContainerList(lst);
        setUpdateFailed(false);
      })
      .catch(() => setUpdateFailed(true));
  };

  const changeContainerState = (id: string) => {
    return (state: ContainerStateSetter) => {
      if (!containerUpdate.includes(id)) {
        setContainerUpdate(containerUpdate.concat([id]));
        setContainerState(token, id, state)
          .then(() => {
            refresh();
            setContainerUpdate(containerUpdate.filter(containerId => containerId !== id)); // Remove from updating list
          })
          .catch(err => setError(err.message));
      }
    };
  };

  const deleteContainer = (id: string) => {
    setContainerUpdate(containerUpdate.concat([id]));
    deleteCont(token, id)
      .then(() => {
        refresh();
        setContainerUpdate(containerUpdate.filter(containerId => containerId !== id));
      })
      .catch(err => setError(err.message));
  };

  return {
    containerList,
    updateFailed,
    containerUpdate,
    error,

    refresh,
    changeContainerState,
    deleteContainer
  };
};