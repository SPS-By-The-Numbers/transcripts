import CloseIcon from '@mui/icons-material/Close';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';

type ActionDialogContentsParams = {
  title: string;
  children: React.ReactNode;
  onClose: (value: string) => void;
};

export default function ActionDialogContents({title, children, onClose}) {
  return (
    <>
      <DialogTitle>
        <Stack
            direction="row"
            sx={{
              justifyContent:"space-between",
              alignItems:"center"}}>
          {title}
          <IconButton onClick={onClose}>
            <CloseIcon fontSize="inherit"/>
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent>
        {children}
      </DialogContent>
    </>
  );
}

