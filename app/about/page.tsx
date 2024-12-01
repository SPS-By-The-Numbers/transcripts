import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

export default function About() {
  return (
    <main>
      <Stack sx={{ alignItems: "center"}} >
        <Card sx={{ width: "100ch", mb: "2ex", mt: 0}} >
          <CardContent>

            <Typography gutterBottom variant="h5" component="div">
              About SPS By The Numbers
            </Typography>
            <p>
              This site was originally created in response to SPS&amp;s attempt to change the
              bell-times because of a supposed inability to staff bus routes. A number
              of parents threw together a survey and gathered over a thousand responses
              showing an overwhelming preference to keep the existing bell-time structure,
              even amongst families who still did not have service.
            </p>

            <p>
              The survey data needed a place to be displayed and thus sps-by-the-numbers.com
              was born.
            </p>

            <p>
              In addition to that survey, some other tools and data analyses for SPS were
              collated. The hope is this site will grow to be a respository for data-centric
              information on SPS.
            </p>

            <p>
              The site itself is fully opensource [on github](https://github.com/awong-dev/sps-by-the-numbers).
            </p>

            <p>
              For questions, email <a href="mailto:sps.by.the.numbers@gmail.com">sps.by.the.numbers@gmail.com</a>.
            </p>

            <p>
              If you wanna contribute ideas, posts, or just hang, join <a href="spsbythenumbers.slack.com
                ">spsbythenumbers.slack.com</a> using this <a href="https://join.slack.com/t/spsbythenumbers/shared_invite/zt-18zrdd0dh-HloXUNn4zgKR0ML3NeCFKg">invite link</a>.
            </p>
          </CardContent>
        </Card>

        <Card sx={{ width: "100ch"}} >
          <CardContent>
            <Typography gutterBottom variant="h5" component="div">
              Contributors (alphabetical by first name):
            </Typography>
            <ul>
              <li>Albert Wong</li>
              <li>Amy Atwood</li>
              <li>Beth Day</li>
              <li>Christie Robertson</li>
              <li>Jane Tunks Demel</li>
              <li>Mark Verrey</li>
              <li>Nancy White</li>
              <li>Tara Chase</li>
              <li>Yeechi Chen</li>
            </ul>
          </CardContent>
        </Card>
      </Stack>
    </main>
  );
}
