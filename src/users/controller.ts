import { Request, Response } from 'express';
import * as admin from 'firebase-admin';

export async function setAdmin(req: Request, res: Response) {
  try {
    console.log('setAdmin');
    const locals = res.locals;
    if (
      typeof locals.email !== 'undefined' &&
      locals.email.endsWith('nicolae.gincota@gmail.com')
    ) {
      console.log('im in');
      await admin.auth().setCustomUserClaims(locals.uid, {
        role: 'admin',
      });
      return res.status(200).send({ status: 'Admin was set' });
    }
    return res.status(400).send({ status: 'Ineligible' });
  } catch (err) {
    return handleError(res, err);
  }
}

export async function create(req: Request, res: Response) {
  try {
    const { displayName, password, email, role } = req.body;

    if (!displayName || !password || !email || !role) {
      return res.status(400).send({ message: 'Missing fields' });
    }

    const { uid } = await admin
      .auth()
      .createUser({ displayName, password, email });
    await admin.auth().setCustomUserClaims(uid, { role });

    return res.status(201).send({ uid });
  } catch (err) {
    return handleError(res, err);
  }
}

export async function all(req: Request, res: Response) {
  try {
    const listUsers = await admin.auth().listUsers();
    const users = listUsers.users.map(mapUser);
    return res.status(200).send({ users });
  } catch (err) {
    return handleError(res, err);
  }
}

export async function get(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const user = await admin.auth().getUser(id);
    return res.status(200).send({ user: mapUser(user) });
  } catch (err) {
    return handleError(res, err);
  }
}

export async function patch(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { email, role } = req.body;
    if (!email || !role) {
      return res.status(400).send({ message: 'Missing fields' });
    }

    await admin.auth().updateUser(id, { email });
    await admin.auth().setCustomUserClaims(id, { role });
    const user = await admin.auth().getUser(id);
    return res.status(204).send({ user: mapUser(user) });
  } catch (err) {
    return handleError(res, err);
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await admin.auth().deleteUser(id);
    return res.status(204).send({});
  } catch (err) {
    return handleError(res, err);
  }
}

function mapUser(user: admin.auth.UserRecord) {
  const customClaims = (user.customClaims || { role: '' }) as { role?: string };
  const role = customClaims.role ? customClaims.role : '';
  return {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || '',
    role,
    lastSignIntTime: user.metadata.lastSignInTime,
    creationTime: user.metadata.creationTime,
  };
}

function handleError(res: Response, err: any) {
  return res.status(500).send({ message: `${err.code} - ${err.message}` });
}
