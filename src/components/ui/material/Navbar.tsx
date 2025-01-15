"use client"
import * as React from "react";
import { styled, alpha } from "@mui/material/styles";
import Box from "@mui/material/Box";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";
import Drawer from "@mui/material/Drawer";
import MenuIcon from "@mui/icons-material/Menu";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ColorModeIconDropdown from "../../shared-theme/ColorModeIconDropdown";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexShrink: 0,
  borderRadius: `calc(${theme.shape.borderRadius}px + 8px)`,
  backdropFilter: "blur(24px)",
  border: "1px solid",
  borderColor: theme.palette.divider,
  backgroundColor: alpha(theme.palette.background.default, 0.4),
  boxShadow: theme.shadows[1],
  padding: "8px 12px",
}));

export default function Navbar() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
  const [userHasTimetable, setUserHasTimetable] = React.useState<
    boolean | null
  >(null);

  React.useEffect(() => {
    const checkUserTimetable = async () => {
      if (session?.user?.email) {
        const response = await fetch(`/api/user?email=${session.user.email}`);
        const userData = await response.json();
        setUserHasTimetable(!!userData.timetableId);
      }
    };
    checkUserTimetable();
  }, [session]);

  const handleNavigation = () => {
    if (!session) {
      router.push("/auth/sign-in");
    } else {
      router.push(userHasTimetable ? "/start" : "/timatable");
    }
  };
  const [open, setOpen] = React.useState(false);

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen);
  };

  return (
    <AppBar
      position="fixed"
      enableColorOnDark
      sx={{
        boxShadow: 0,
        bgcolor: "transparent",
        backgroundImage: "none",
        mt: "calc(var(--template-frame-height, 0px) + 28px)",
      }}
    >
      <Container maxWidth="lg">
        <StyledToolbar variant="dense" disableGutters>
          <Box
            sx={{ flexGrow: 1, display: "flex", alignItems: "center", px: 0 }}
          >
            {/* //LOGO HERE */}
            MarkIT
            <Box sx={{ display: { xs: "none", md: "flex" } }}>
              {!user && (
              <Link href="/">
              <Button variant="text" color="info" size="small">
                Home
              </Button>
            </Link>
            )}
              
              <Link href="/schedule">
                <Button variant="text" color="info" size="small">
                  Schedule
                </Button>
              </Link>
              <Link href="/attendance">
                <Button variant="text" color="info" size="small">
                  Attendence
                </Button>
              </Link>
              <Link href="/calendar">
                <Button variant="text" color="info" size="small">
                  Calendar
                </Button>
              </Link>
              <Link href="/timetable">
                <Button variant="text" color="info" size="small">
                  Timetable
                </Button>
              </Link>
              {/* <Link href="/feedback">
                <Button variant="text" color="info" size="small">
                  Feedback
                </Button>
              </Link>               */}
            </Box>
          </Box>
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              gap: 1,
              alignItems: "center",
            }}
          >
            {user && (
              <Button
              color="primary"
              variant="text"
              size="small"
              onClick={() => signOut()}
            >
              Sign Out
            </Button>
            )}
            
            { !user && (
              <Button
              color="primary"
              variant="contained"
              size="small"
              onClick={() => handleNavigation()}
            >
              Sign In
            </Button>
            )}
            
            <ColorModeIconDropdown />
          </Box>
          <Box sx={{ display: { xs: "flex", md: "none" }, gap: 1 }}>
            <ColorModeIconDropdown size="medium" />
            <IconButton aria-label="Menu button" onClick={toggleDrawer(true)}>
              <MenuIcon />
            </IconButton>
            <Drawer
              anchor="top"
              open={open}
              onClose={toggleDrawer(false)}
              PaperProps={{
                sx: {
                  top: "var(--template-frame-height, 0px)",
                },
              }}
            >
              <Box sx={{ p: 2, backgroundColor: "background.default" }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  <IconButton onClick={toggleDrawer(false)}>
                    <CloseRoundedIcon />
                  </IconButton>
                </Box>

                <MenuItem>Home</MenuItem>
                <MenuItem>Schedule</MenuItem>
                <MenuItem>Attendence</MenuItem>
                <MenuItem>Calendar</MenuItem>

                <Divider sx={{ my: 3 }} />
                <MenuItem>
                  <Button color="primary" variant="contained" fullWidth>
                    Sign up
                  </Button>
                </MenuItem>
                <MenuItem>
                  <Button color="primary" variant="outlined" fullWidth>
                    Sign in
                  </Button>
                </MenuItem>
              </Box>
            </Drawer>
          </Box>
        </StyledToolbar>
      </Container>
    </AppBar>
  );
}
