import Appointment from '../models/Appointment';
import { startOfHour, parseISO, isBefore } from "date-fns";
import User from '../models/User';
import * as Yup from 'yup';

class AppointmentController {
  async store(req, res) {
    const Schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required(),
    });

    if (!(await Schema.isValid(req.body))) {
      return res.status(400).json({ error: 'validation fails' });
    }

    const { provider_id, date} = req.body;

    //check if provider_id is a provider

    const isProvider = await User.findOne({
       where: { id: provider_id, provider: true },
    });

    if (!isProvider) {
      return res
      .status(401)
      .json({ error: 'You can only create appointments with providers' });
    }

    // Check for past dates

    const hourStart = startOfHour(parseISO(date));

    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: 'Past dates are not permitted'});
    }

    // Check date availability

    const checkAveilability = await Appointment.findOne({
      where: {
        provider_id,
        canceled_at: null,
        date: hourStart,
      }
    });

    if (checkAveilability) {
      return res.status(400).json({ error: 'Appointment date is not available'});
    }

    const appointment = await Appointment.create({
      user_id: req.userId,
      provider_id,
      date,
    });

    return res.json(appointment);
  }
}

export default new AppointmentController();
