import React from 'react';
import {
  Typography,
  IconButton,
  makeStyles,
  withStyles
} from '@material-ui/core';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import MuiDialogActions, { DialogActionsProps } from '@material-ui/core/DialogActions';
import {
  Close
} from '@material-ui/icons';

export const DialogTitle = withStyles((theme) => ({
  closeButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1)
  }
}))((props: {
  onClose: () => void,
  classes: { closeButton: string },
  children: string | string[]
}) => {
  return <MuiDialogTitle>
    <Typography variant='h6'>{props.children}</Typography>
    <IconButton onClick={props.onClose} className={props.classes.closeButton}>
      <Close />
    </IconButton>
  </MuiDialogTitle>;
});

export const DialogActions = (props: DialogActionsProps) => {
  const styles = makeStyles({
    root: {
      margin: '5%'
    }
  })();
  return <MuiDialogActions className={styles.root}>
    {props.children}
  </MuiDialogActions>;
};