const path = require('path');
const { spawn } = require('child_process');
const Attendance = require('../models/Attendance');
const User = require('../models/User');

exports.verifyLiveness = async (req, res) => {
  try {
    const { images } = req.body;

    if (!images || images.length === 0) {
      return res.status(400).json({ status: 'fail', message: 'No images provided for verification' });
    }

    const pythonExecutable = path.join(__dirname, '../venv311/Scripts/python.exe');
    const scriptPath = path.join(__dirname, '../python_scripts/liveness_check.py');

    const pythonProcess = spawn(pythonExecutable, [scriptPath]);

    let dataToSend = '';
    
    pythonProcess.stdout.on('data', (data) => {
      dataToSend += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
    });

    pythonProcess.on('close', (code) => {
      if (!dataToSend || dataToSend.trim() === '') {
         return res.status(500).json({ status: 'fail', message: 'No response from biometric engine.' });
      }

      try {
        const jsonStartIndex = dataToSend.indexOf('{');
        if (jsonStartIndex === -1) throw new Error("JSON not found in output");
        
        const cleanJsonString = dataToSend.substring(jsonStartIndex);
        const result = JSON.parse(cleanJsonString);

        if (result.status === 'success') {
          return res.status(200).json({
            status: 'success',
            message: 'Real Person Verified'
          });
        } else {
          return res.status(400).json({
            status: 'fail',
            message: result.message || 'Liveness check failed.'
          });
        }
      } catch (parseError) {
        return res.status(500).json({
          status: 'error',
          message: 'Invalid response from biometric engine'
        });
      }
    });

    try {
      pythonProcess.stdin.write(JSON.stringify({ images }));
      pythonProcess.stdin.end();
    } catch (writeError) {
      return res.status(500).json({ status: 'error', message: 'Failed to send data to engine.' });
    }

  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.clockIn = async (req, res) => {
  try {
    const userId = req.user.id; 

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ status: 'fail', message: 'User not found' });
    }

    const today = new Date().toLocaleDateString('en-CA');
    const startOfDay = new Date(`${today}T00:00:00+05:30`);
    const endOfDay = new Date(`${today}T23:59:59.999+05:30`);

    const existingAttendance = await Attendance.findOne({
      employee: userId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (existingAttendance && existingAttendance.clockIn) {
      return res.status(400).json({
        status: 'fail',
        message: 'Already clocked in for today'
      });
    }

    const currentTime = new Date();

    const attendance = new Attendance({
      employee: userId,
      companyName: user.companyName || user.company || 'Default Company',
      date: currentTime,
      clockIn: currentTime, 
      status: 'Present',
      verificationMethod: 'GPS' 
    });

    await attendance.save();

    return res.status(200).json({
      status: 'success',
      message: 'Attendance Marked Successfully',
      data: attendance
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.clockOut = async (req, res) => {
  try {
    const userId = req.user.id;

    const today = new Date().toLocaleDateString('en-CA');
    const startOfDay = new Date(`${today}T00:00:00+05:30`);
    const endOfDay = new Date(`${today}T23:59:59.999+05:30`);

    const attendance = await Attendance.findOne({
      employee: userId,
      date: { $gte: startOfDay, $lte: endOfDay },
      clockOut: null 
    });

    if (!attendance) {
      return res.status(404).json({
        status: 'fail',
        message: 'Active check-in record not found for today'
      });
    }

    const currentTime = new Date();
    attendance.clockOut = currentTime;

    const diffMs = currentTime - attendance.clockIn;
    const diffHrs = (diffMs / (1000 * 60 * 60)).toFixed(2);
    attendance.totalHours = parseFloat(diffHrs);

    await attendance.save();

    return res.status(200).json({
      status: 'success',
      message: 'Checked out successfully',
      data: attendance
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getTodayAttendance = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const today = new Date().toLocaleDateString('en-CA');
    const startOfDay = new Date(`${today}T00:00:00+05:30`);
    const endOfDay = new Date(`${today}T23:59:59.999+05:30`);

    const attendance = await Attendance.findOne({
      employee: userId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    return res.status(200).json({
      status: 'success',
      data: attendance
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getCompanyAttendance = async (req, res) => {
  try {
    const { date } = req.query; 
    let startOfDay, endOfDay;
    
    if (date) {
      startOfDay = new Date(`${date}T00:00:00+05:30`);
      endOfDay = new Date(`${date}T23:59:59.999+05:30`);
    } else {
      const today = new Date().toLocaleDateString('en-CA'); 
      startOfDay = new Date(`${today}T00:00:00+05:30`);
      endOfDay = new Date(`${today}T23:59:59.999+05:30`);
    }

    const attendanceRecords = await Attendance.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    }).populate('employee', 'name employeeId department email role');

    return res.status(200).json({
      status: 'success',
      data: attendanceRecords
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getAttendanceHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const history = await Attendance.find({ employee: userId }).sort({ date: -1 });
    
    return res.status(200).json({
      status: 'success',
      data: history
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};