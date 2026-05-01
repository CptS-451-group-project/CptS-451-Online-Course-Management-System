/**
 * Shared handler: Postgres constraint + trigger errors → HTTP JSON the UI can show.
 * Route files pass optional duplicateMessage / fkMessage when the default text is too vague.
 */
const fs = require('fs');
const path = require('path');
const pgErrorCatalog = require('./pgErrorCatalog.json');
// Keep a writable path so unknown DB errors can be promoted into known mappings.
const CATALOG_PATH = path.join(__dirname, 'pgErrorCatalog.json');
// Feature flag: only auto-add unknown errors when this env var is explicitly true.
const AUTO_PROMOTE_UNKNOWN_PG = process.env.AUTO_PROMOTE_UNKNOWN_PG === 'true';

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

// Lookup order is most specific -> most general:
// code+constraint, then constraint, then code.
function lookupCatalog(err) {
    const code = err && err.code;
    const constraint = err && err.constraint;
    if (!code) return null;

    const key = `${code}:${constraint || ''}`;
    const byCodeConstraint = pgErrorCatalog.byCodeConstraint || {};
    const byConstraint = pgErrorCatalog.byConstraint || {};
    const byCode = pgErrorCatalog.byCode || {};

    if (constraint && byCodeConstraint[key]) return byCodeConstraint[key];
    if (constraint && byConstraint[constraint]) return byConstraint[constraint];
    if (byCode[code]) return byCode[code];
    return null;
}

// Unknown PG errors are logged as JSON lines so they are easy to review/filter later.
function logUnknownPostgresError(err, options = {}) {
    const logDir = path.join(__dirname, '../logs');
    const logFile = path.join(logDir, 'unknown-pg-errors.log');
    const payload = {
        timestamp: new Date().toISOString(),
        context: options.context || null,
        code: err.code || null,
        constraint: err.constraint || null,
        table: err.table || null,
        column: err.column || null,
        detail: err.detail || null,
        message: err.message || null,
    };

    try {
        fs.mkdirSync(logDir, { recursive: true });
        fs.appendFileSync(logFile, `${JSON.stringify(payload)}\n`, 'utf8');
    } catch (writeErr) {
        console.error('Failed to write unknown Postgres error log:', writeErr.message);
    }
}

function buildAutoMessage(err) {
    // Keep auto-added text generic/safe; developers can refine later.
    if (err && err.code === '22P02') return 'Invalid value format.';
    if (err && err.code === '22001') return 'Value is too long for this field.';
    return 'Database rejected this request.';
}

// Optional "learning" step: when enabled, write a starter catalog entry for new errors.
// This never overwrites existing manual mappings.
function autoPromoteUnknownPostgresError(err) {
    if (!AUTO_PROMOTE_UNKNOWN_PG || !err || !err.code) return false;

    try {
        const raw = fs.readFileSync(CATALOG_PATH, 'utf8');
        const catalog = JSON.parse(raw);
        catalog.byCode = catalog.byCode || {};
        catalog.byConstraint = catalog.byConstraint || {};
        catalog.byCodeConstraint = catalog.byCodeConstraint || {};

        const code = err.code;
        const constraint = err.constraint || null;
        const codeConstraintKey = `${code}:${constraint || ''}`;

        // Respect existing manual mappings.
        if (constraint && catalog.byCodeConstraint[codeConstraintKey]) return false;
        if (constraint && catalog.byConstraint[constraint]) return false;
        if (catalog.byCode[code]) return false;

        const entry = {
            status: 400,
            message: buildAutoMessage(err),
            autoAdded: true,
        };

        if (constraint) {
            catalog.byCodeConstraint[codeConstraintKey] = entry;
        } else {
            catalog.byCode[code] = entry;
        }

        fs.writeFileSync(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
        return true;
    } catch (writeErr) {
        console.error('Failed to auto-promote Postgres error:', writeErr.message);
        return false;
    }
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

    const catalogMatch = lookupCatalog(err);
    if (catalogMatch) {
        let message = catalogMatch.message;
        if (err.code === PG.UNIQUE_VIOLATION && duplicateMessage) message = duplicateMessage;
        if (err.code === PG.FOREIGN_KEY_VIOLATION && fkMessage) message = fkMessage;
        if (err.code === PG.CHECK_VIOLATION && checkMessage) message = checkMessage;
        return { status: catalogMatch.status || 400, message };
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
        context,
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

    // Unknown/unmapped path: keep the frontend stable with fallback JSON,
    // and record technical details for developers.
    if (err && err.code) {
        logUnknownPostgresError(err, { context });
        autoPromoteUnknownPostgresError(err);
    }
    console.error(err && err.message);
    res.status(defaultStatus).json(body(defaultMessage));
    return false;
}

module.exports = {
    PG,
    mapPostgresError,
    sendPgError,
};
