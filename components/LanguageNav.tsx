'use client'

import * as Constants from 'config/constants';
import Autocomplete from '@mui/material/Autocomplete';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import { SupportedLanguages } from 'common/languages';
import { useState } from 'react'

import type { Iso6393Code } from 'common/params';
import type { SxProps, Theme } from '@mui/material';

function makeLangOptions() {
  const options = Object.entries(SupportedLanguages).map(
      ([langCode, info]) => ({ label: info.displayName, value: langCode}));
  const moveTopToFront = (x,y) => {
    const xLocation = Constants.TOP_LANGUAGES.findIndex(element => element === x.value);
    const yLocation = Constants.TOP_LANGUAGES.findIndex(element => element === y.value);

    if (xLocation === -1 && yLocation === -1) {
      // Not in the top. Return same and rely on ECMA 2019 stable sort.
      return 0;
    }

    if (xLocation === -1) {
      // yLocation must be in the list so x is earlier.
      return 1;
    }

    if (yLocation === -1) {
      // xLocation must be in the list so y is later
      return -1;
    }

    // Now we compare within the top rank itself.
    if (xLocation < yLocation) {
      return -1;
    }

    if (xLocation > yLocation) {
      return 1;
    }

    return 0;
  };

  return options.sort(moveTopToFront);
}

const LangOptions = makeLangOptions();

type LanguageNavParams = {
  name : string;
  curLang : Iso6393Code;
  sx?: SxProps<Theme>;
};

export default function LanguageNav({ name, curLang, sx = [] } : LanguageNavParams) {
  const [newLang, setNewLang] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const navigateToNewLang = (newOption) => {
    setNewLang(newOption.value);
    const pathParts = window.location.pathname.split('/');
    const lastPart = pathParts.at(-1) ?? '';
    if (lastPart in SupportedLanguages) {
      // Has language in path. Strip it replace.
      pathParts[pathParts.length - 1] = newOption.value;
    } else {
      pathParts.push(newOption.value);
    }

    setLoading(true);
    window.location.pathname = pathParts.join('/');
  };

  
  return (
    <>
      <Autocomplete
        disableClearable
        size="small"
        id={name}
        value={ LangOptions.find(element => element.value === (newLang ?? curLang)) }
        options={ LangOptions }
        onChange={(_event, newValue) => navigateToNewLang(newValue)}
        renderInput={
          (params) => (
            <TextField
              sx={{input: {textAlign: "center"}}}
              {...params}
            />)
        }
        sx={[
          {
            bgcolor: 'primary.main',
            "& .MuiOutlinedInput-root": {
              color: 'primary.contrastText',
            },
          },
          ...(Array.isArray(sx) ? sx : [sx])
        ]}
      />
      <Backdrop
        sx={(theme) => ({ color: '#fff', zIndex: theme.zIndex.drawer + 1 })}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </>
  );
}
