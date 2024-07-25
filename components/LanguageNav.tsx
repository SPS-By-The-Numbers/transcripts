'use client'

import * as Constants from 'config/constants';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { useState } from 'react'
import { SupportedLanguages } from 'common/languages';

import type { Iso6393Code } from 'common/params';

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
};

export default function LanguageNav({ name, curLang } : LanguageNavParams) {
  const [newLang, setNewLang] = useState<string | undefined>(undefined);

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

    window.location.pathname = pathParts.join('/');
  };

  
  return (<>
    <Autocomplete
      disableClearable
      size="small"
      id={name}
      value={ LangOptions.find(element => element.value === (newLang ?? curLang)) }
      options={ LangOptions }
      onChange={(_event, newValue) => navigateToNewLang(newValue)}
      renderInput={(params) => <TextField {...params}  sx={{input: {textAlign: "center"}}} />}
      sx={{
        backgroundColor: 'rgb(67,130,247)',
      }}
      />
    </>);
}
