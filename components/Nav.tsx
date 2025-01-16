'use client'

import * as Constants from 'config/constants';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import Link from '@mui/material/Link';
import NextLink from 'next/link';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MenuIcon from '@mui/icons-material/Menu';
import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import { useNavState } from 'components/providers/NavStateProvider';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import type { CategoryId } from 'common/params';
import type { SelectChangeEvent } from '@mui/material/Select';
import type { SxProps, Theme } from '@mui/material';

const navConfigs = [
  { name: 'Transcripts',
    useCategory: true,
    pathSuffix: 'v',
  },
  { name: 'Search Archives',
    useCategory: true,
    pathSuffix: 'search',
  },
  { name: 'About',
    useCategory: false,
    pathSuffix: 'about',
  }
];

const categoryItems = 
  Object.entries(Constants.CATEGORY_CHANNEL_MAP).map(
    ([categoryId, info]) => {
      return ({categoryId, name: info.name});
    }).sort((a,b) => {
      if (a.name < b.name) {
        return -1;
      } else if (a.name > b.name) {
        return 1;
      }
      return 0;
    });

function NavLink({href, children, sx=[]} : {href: string, children: React.ReactNode, sx?: SxProps<Theme>}) {
  const pathname = usePathname();

  return (
    <Link
        component={NextLink}
        href={href}
        underline="none"
        sx={[{
          display: "flex",
          alignSelf: "stretch",
        },
        ...(Array.isArray(sx) ? sx : [sx])
        ]}>
      <Button 
        sx={{
          backgroundColor: pathname.startsWith(href) ? 'primary.light' : 'primary.main',
          color: 'primary.contrastText',
          alignSelf: "stretch",
          textTransform: 'none',
          paddingX: "1rem",
          borderRadius: 0,
          ':hover': {
            bgcolor: 'primary.dark',
            color: 'white',
          },
        }}>
        {children}
      </Button>
    </Link>
  );
}

function CategorySelection({category, suffixPath, onCategoryChange} : {category: CategoryId, suffixPath: string, onCategoryChange: (event: SelectChangeEvent) => void}) {
  return (
    <Box
        sx={{
          display: 'flex',
          alignSelf: 'stretch',
          alignItems: 'center',
          paddingX: '0.75rem',
          ':hover': {
            backgroundColor: 'primary.dark',
            color: 'primary.contrastText',
          },
        }}
    >
      <FormControl hiddenLabel>
        <Select
          size="small"
          variant="standard"
          labelId='category-label'
          label="cateogry"
          id='category-select'
          renderValue={(category) => (
            <Typography sx={{ color: "textContrast" }}>
              {Constants.CATEGORY_CHANNEL_MAP[category]?.name}
            </Typography>
          )}
          value={category}
          onChange={onCategoryChange}
          sx={{
            minWidth: "20ch",
            color: 'primary.contrastText',
          }}
        >
          {categoryItems.map(
            item => (
              <MenuItem key={item.categoryId} value={item.categoryId}>
                <Link
                  component={NextLink}
                  href={['',item.categoryId, suffixPath].join('/')}
                  underline="none"
                  sx={{color: 'inherit'}}
                >
                  {item.name}
                </Link>
              </MenuItem>
            ))}
        </Select>
      </FormControl>
    </Box>
  );
}

function MobileToggle({category} : {category: CategoryId}) {
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
  };

  const menuSelected = () => {
    setMenuAnchorEl(null);
  };

  return (
    <Box sx={{ flexGrow: 0, display: { xs: 'flex', md: 'none' } }}>
      <IconButton
        size="large"
        aria-label="navigation menu"
        aria-controls="menu-appbar"
        aria-haspopup="true"
        onClick={handleOpenMenu}
        color="inherit"
      >
        <MenuIcon />
      </IconButton>
      <Menu
        id="menu-appbar"
        anchorEl={menuAnchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        open={Boolean(menuAnchorEl)}
        onClose={handleCloseMenu}
        sx={{ display: { xs: 'block', md: 'none' } }}
      >
        {navConfigs.map(({name}, i) => (
          <MenuItem key={i} onClick={() => menuSelected()}>
            <Typography sx={{ textAlign: 'center' }}>{name}</Typography>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}

function SingleDesktopLink({href, name} : {href: string, name: string}) {
  return (
    <NavLink href={href}>
      <Typography>
        {name}
      </Typography>
    </NavLink>
  );
}

function DesktopLinks({category} : {category: CategoryId}) {
  const pathname = usePathname();

  return (
    <Stack direction="row"
        sx={{
          display: { xs: 'none', md: "flex"},
          alignSelf: "stretch",
          flexGrow: 1,
        }}>
      {
        navConfigs.map(({name, useCategory, pathSuffix}, i) => (
          <SingleDesktopLink
            key={i}
            href={useCategory? `/${category}/${pathSuffix}`: `/${pathSuffix}`}
            name={name}
          />
        ))
      }
    </Stack>
  );
}

export default function Nav() {
  const {category, setCategory} = useNavState();

  const handleCategoryChange = (event: SelectChangeEvent) => {
    setCategory(event.target.value);
  };

  const pathname = usePathname();
  const parts = pathname.split('/');
  const suffixPath = parts.splice(2).join('/');

  return (
      <AppBar position="sticky" color="primary">

        {/* Banner for test/staging */}
        <Box sx={{
            display: Constants.isProduction ? "none" : "flex",
            backgroundColor: "red",
            justifyContent: "center",
            width: "100%"
            }}>
          Dev Mode. Emulators used.
        </Box>

        <Toolbar
            variant="dense"
            sx={{
              backgroundColor: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>

          {/* Home icon */}
          <NavLink
              href={Constants.HOME_URL}
              sx={{
                marginRight: ".5rem",
              }}>
            <img alt="Home" src={'/logo.png'} height={36} />
          </NavLink>
          <DesktopLinks category={category} />
          <CategorySelection category={category} onCategoryChange={handleCategoryChange} suffixPath={suffixPath} />
          <MobileToggle category={category} />
        </Toolbar>
      </AppBar>
  );
}

