'use client'
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import SpeakerInfoControl from 'components/SpeakerInfoControl';
import React from 'react';

import type { CategoryId } from 'common/params';
import type { SxProps, Theme } from '@mui/material';
import type { ExistingNames, TagSet } from 'utilities/client/speaker';

type InfoEditPanelParams = {
  category: CategoryId;
  videoId: string;
  initialExistingNames: ExistingNames;
  initialExistingTags: TagSet;
  speakerNums : Set<number>;
  sx?: SxProps<Theme>;
};

function a11yProps(index: number) {
  return {
    id: `infoedit-tab-${index}`,
    'aria-controls': `infoedit-tabpanel-${index}`,
  };
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function InfoEditPanel({
    category,
    videoId,
    speakerNums,
    initialExistingNames,
    initialExistingTags,
    sx=[]} : InfoEditPanelParams) {

  const [value, setValue] = React.useState('1');
  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  return (
    <Box sx={[{paddingY: 0}, ...(Array.isArray(sx) ? sx : [sx])]}>
      <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
         <Tab label="Speakers" {...a11yProps(0)} />
         <Tab label="Info" {...a11yProps(1)} />
         <Tab label="Links" {...a11yProps(2)} />
      </Tabs>
      <CustomTabPanel value={value} index={0}>
        <SpeakerInfoControl
          category={category}
          speakerNums={speakerNums}
          videoId={videoId}
          initialExistingNames={initialExistingNames}
          initialExistingTags={initialExistingTags}
        />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={1}>
        Tab 1
      </CustomTabPanel>
      <CustomTabPanel value={value} index={2}>
        Tab 2
      </CustomTabPanel>
    </Box>
  );
}
