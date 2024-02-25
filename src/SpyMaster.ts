import {
    Bool,
    DeployArgs,
    Permissions,
    Provable,
    SelfProof,
    SmartContract,
    State,
    UInt64,
    ZkProgram,
    method,
    state,
} from "o1js"

export const SpyMasterZkProgram = ZkProgram({
    name: "SpyMasterZkProgram",
    publicInput: UInt64,
    publicOutput: UInt64,
    methods: {
        baseCase: {
            privateInputs: [],
            method(initialHighestMessageNo: UInt64) {
                return initialHighestMessageNo
            },
        },
        receiveMessageFromAgent: {
            privateInputs: [SelfProof, UInt64, UInt64, UInt64, UInt64, UInt64],
            method(
                highestMesssageNo: UInt64,
                earlierProof: SelfProof<UInt64, UInt64>,
                messageNo: UInt64,
                agentId: UInt64,
                xLocation: UInt64,
                yLocation: UInt64,
                checksum: UInt64,
            ) {
                earlierProof.publicOutput.assertEquals(highestMesssageNo)

                const isAgentIdZero = agentId.equals(UInt64.from(0))
                const isMessageDuplicate = messageNo.lessThanOrEqual(highestMesssageNo)
                const isChecksumValid = checksum.equals(agentId.add(xLocation).add(yLocation))
                const isAgentIdValid = agentId.lessThanOrEqual(UInt64.from(3000))
                const isXLocationValid = xLocation.lessThanOrEqual(UInt64.from(15000))
                const isYLocationValid = Bool(true)
                    .and(yLocation.greaterThanOrEqual(UInt64.from(5000)))
                    .and(yLocation.lessThanOrEqual(UInt64.from(20000)))
                const isYLocationGreaterThanXLocation = yLocation.greaterThan(xLocation)

                const isMessageValid = isAgentIdZero
                    .or(isMessageDuplicate)
                    .or(
                        isChecksumValid
                            .and(isAgentIdValid)
                            .and(isXLocationValid)
                            .and(isYLocationValid)
                            .and(isYLocationGreaterThanXLocation),
                    )

                const newHighestMessageNo = Provable.if(
                    isMessageValid.and(isMessageDuplicate.not()),
                    messageNo,
                    highestMesssageNo,
                )

                return newHighestMessageNo
            },
        },
    },
})

export class SpyMasterProof extends ZkProgram.Proof(SpyMasterZkProgram) {}

export class SpyMasterSmartContract extends SmartContract {
    @state(UInt64) highestMesssageNo = State<UInt64>()

    deploy(deployArgs?: DeployArgs) {
        super.deploy(deployArgs)
        this.account.permissions.set({
            ...Permissions.allImpossible(),
            access: Permissions.proof(),
            editState: Permissions.proof(),
        })
    }

    @method updateHighestMessageNo(proof: SpyMasterProof) {
        proof.verify()
        this.highestMesssageNo.set(proof.publicOutput)
    }
}
