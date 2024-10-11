const xsolApp = express();
const xsolPort = 4000;

xsolApp.use(express.json());

xsolApp.post('/xsol-api-endpoint', (req, res) => {
    console.log("Xsol server received:", req.body);
    res.json({ message: 'Action processed by Xsol server' });
});

xsolApp.listen(xsolPort, () => {
    console.log(`Mock Xsol server listening on port ${xsolPort}`);
});

