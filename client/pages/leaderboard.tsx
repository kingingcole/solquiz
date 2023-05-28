import { Avatar, Box, Stack } from "@mui/material";
import { useEth } from "eth.context";
import { LeaderboardUser } from "models";
import { useEffect, useState } from "react";
import { getTruncatedAddress } from "styles/utils";

const Leaderboard = (): JSX.Element | null => {
    const eth = useEth();
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(false);

    const getLeaderboard = async () => {
        if (!eth.ready) return;

        setLoading(true);

        try {
            const {0: addresses, 1: displayNames, 2: points} = await eth.contracts.solQuiz.methods.getLeaderboard().call();
            console.assert(addresses.length === displayNames.length && displayNames.length === points.length, 'Leaderboard data is corrupted');
            const leaderBoard: LeaderboardUser[] = [];
            addresses.forEach((address: string, index: number) => {
                leaderBoard.push({
                    address,
                    displayName: displayNames[index],
                    points: points[index]
                })
            })
            leaderBoard.length > 1 && leaderBoard.sort((a, b) => (b.points || 0) - (a.points || 0));
            setLeaderboard(leaderBoard);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        getLeaderboard();
    }, [eth]);

    function stringToColor(string: string) {
        let hash = 0;
        let i;
      
        /* eslint-disable no-bitwise */
        for (i = 0; i < string.length; i += 1) {
          hash = string.charCodeAt(i) + ((hash << 5) - hash);
        }
      
        let color = '#';
      
        for (i = 0; i < 3; i += 1) {
          const value = (hash >> (i * 8)) & 0xff;
          color += `00${value.toString(16)}`.slice(-2);
        }
        /* eslint-enable no-bitwise */
      
        return color;
    }

    function stringAvatar(name: string) {
        return {
          sx: {
            bgcolor: stringToColor(name),
          },
          children: `${name.split(' ')[0][0]}${name.split(' ')[1] ? name.split(' ')[1][0] : ''}`,
        };
    }

    if (!eth.ready) {
        return null;
    }

    const displayLeaderboard = () => {
        if (loading) {
            return <p>Loading...</p>
        }
        
        if (!leaderboard.length) {
            return <p>No leaderboard data yet</p>
        }

        return leaderboard.map((user, index) => {
            return (
                <Stack sx={{maxWidth: '600px'}} key={user.address} direction={'row'} spacing={2} alignItems={'center'}>
                    <p style={{ fontSize: '16px'}}>{index + 1}.</p>
                    <Avatar {...stringAvatar(user.displayName)} />
                    <p style={{ fontSize: '16px'}}>{user.displayName} - {getTruncatedAddress(user.address)}</p>
                    {eth.account === user.address && <p>(You)</p>}
                    <p style={{ fontSize: '16px'}}>{user.points} points</p>
                </Stack>
            )
        })
    }
    
    return (
        <Box>
            <h3>Leaderboard</h3>
            {displayLeaderboard()}    
        </Box>
    )
}

export default Leaderboard;