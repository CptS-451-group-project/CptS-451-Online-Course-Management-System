/**
 * Shared handler: Postgres constraint + trigger errors → HTTP JSON the UI can show.
 * Route files pass optional duplicateMessage / fkMessage when the default text is too vague.
 */

// Official SQLSTATE codes used by node-postgres on `err.code`
const PG = {
    UNIQUE_VIOLATION: '23505',
    FOREIGN_KEY_VIOLATION: '23503',
    NOT_NULL_VIOLATION: '23502',
    CHECK_VIOLATION: '23514',
    /** plpgsql RAISE EXCEPTION (e.g. capacity trigger) */
    RAISE_EXCEPTION: 'P0001',
};

// Strip noisy prefix from PL/pgSQL RAISE EXCEPTION text before sending to the client
function cleanRaiseMessage(message) {
    if (!message) return '';
    return message.replace(/^ERROR:\s*/i, '').replace(/\n.*$/s, '').trim();
}

/** Pick status + message for this error, or null if not a handled Postgres code */
function mapPostgresError(err, opts = {}) {
    if (!err) return null;

    const {
        duplicateMessage,
        fkMessage,
        checkMessage,
    } = opts;

    // Trigger: RAISE EXCEPTION '...' (capacity, etc.)
    if (err.code === PG.RAISE_EXCEPTION) {
        const msg = cleanRaiseMessage(err.message);
        return { status: 400, message: msg || 'Database rule prevented this action.' };
    }
    if (err.message && /Enrollment failed/i.test(err.message)) {
        return { status: 400, message: cleanRaiseMessage(err.message) };
    }

    switch (err.code) {
        case PG.UNIQUE_VIOLATION:
            return {
                status: 409,
                message:
                    duplicateMessage ||
                    'That value already exists (duplicate record).',
            };
        case PG.FOREIGN_KEY_VIOLATION:
            return {
                status: 400,
                message:
                    fkMessage ||
                    'This action conflicts with related data (invalid reference or delete blocked).',
            };
        case PG.NOT_NULL_VIOLATION:
            return {
                status: 400,
                message: 'A required field is missing.',
            };
        case PG.CHECK_VIOLATION:
            return {
                status: 400,
                message:
                    checkMessage ||
                    'Data failed a validation rule.',
            };
        default:
            return null;
    }
}

/**
 * Always sends one JSON response (mapped DB error, or fallback).
 * Body uses both `error` and `message` so login/register pages work either way.
 * @returns {boolean} true if Postgres supplied a specific rule (duplicate, FK, etc.)
 */
function sendPgError(res, err, options = {}) {
    const {
        defaultStatus = 500,
        defaultMessage = 'Something went wrong.',
        duplicateMessage,
        fkMessage,
        checkMessage,
    } = options;

    const mapped = mapPostgresError(err, {
        duplicateMessage,
        fkMessage,
        checkMessage,
    });

    const body = (msg) => ({ error: msg, message: msg });

    if (mapped) {
        res.status(mapped.status).json(body(mapped.message));
        return true;
    }

    // Not a mapped Postgres code (e.g. network); still return JSON so fetch().json() works
    console.error(err && err.message);
    res.status(defaultStatus).json(body(defaultMessage));
    return false;
}

module.exports = {
    PG,
    mapPostgresError,
    sendPgError,
};
